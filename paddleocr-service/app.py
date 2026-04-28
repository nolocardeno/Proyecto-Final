"""
Scantral — PaddleOCR sidecar microservice.

Replaces the legacy Tesseract / Tess4J fallback with a modern, CPU-friendly
OCR engine (PP-OCRv4). Exposes a single HTTP endpoint that the Spring backend
calls when the primary AI extractor (Gemini) is unavailable.

Endpoints:
    GET  /health   -> liveness + active config
    POST /ocr      -> multipart "file" -> { text, lines[], averageConfidence }

The Java side keeps its heuristic parser (`OcrTextParser`) so we only need
to return plain text joined by newlines, plus per-line confidence so the
backend can log quality metrics.
"""

from __future__ import annotations

import io
import logging
import os

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from paddleocr import PaddleOCR

# `latin` covers Spanish + English + most European languages with a single
# recognizer, which matches the previous `spa+eng` Tesseract setup.
LANG = os.getenv("OCR_LANGUAGE", "latin")
USE_GPU = os.getenv("OCR_USE_GPU", "false").lower() == "true"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
log = logging.getLogger("paddleocr-service")

app = FastAPI(title="Scantral PaddleOCR sidecar", version="1.0.0")

# Loading the model is expensive (~1–2s, several hundred MB of weights), so
# it MUST be instantiated once at startup and reused across requests.
ocr = PaddleOCR(
    use_angle_cls=True,
    lang=LANG,
    use_gpu=USE_GPU,
    show_log=False,
)
log.info("PaddleOCR ready (lang=%s, gpu=%s)", LANG, USE_GPU)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "lang": LANG, "gpu": USE_GPU}


@app.post("/ocr")
async def run_ocr(file: UploadFile = File(...)) -> dict:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail=f"Cannot decode image: {exc}") from exc

    arr = np.array(img)

    try:
        result = ocr.ocr(arr, cls=True)
    except Exception as exc:
        log.exception("PaddleOCR inference failed")
        raise HTTPException(status_code=500, detail=f"OCR failure: {exc}") from exc

    # PaddleOCR v2.x returns: [[ [box, (text, confidence)], ... ]] for one page.
    lines: list[dict] = []
    page = result[0] if result else None
    if page:
        for entry in page:
            if not entry or len(entry) < 2:
                continue
            box = entry[0]
            payload = entry[1]
            if isinstance(payload, (list, tuple)) and len(payload) >= 2:
                text = str(payload[0])
                confidence = float(payload[1])
            else:
                text = str(payload)
                confidence = 0.0
            if not text.strip():
                continue
            lines.append({"text": text, "confidence": confidence, "box": box})

    full_text = "\n".join(line["text"] for line in lines)
    avg_conf = (
        sum(line["confidence"] for line in lines) / len(lines) if lines else 0.0
    )
    log.info("OCR done: %d lines, %d chars, avgConf=%.3f",
             len(lines), len(full_text), avg_conf)
    return {"text": full_text, "lines": lines, "averageConfidence": avg_conf}
