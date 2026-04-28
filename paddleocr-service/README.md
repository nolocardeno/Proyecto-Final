# Scantral — PaddleOCR sidecar

Lightweight Python microservice that exposes [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
(PP-OCRv4) over HTTP. Replaces the legacy Tesseract / Tess4J fallback used by
the Spring backend when the primary AI extractor (Gemini) is unavailable.

## Why PaddleOCR

- Modern (PP-OCRv4 / v5), much higher accuracy than Tesseract on receipts and
  ID cards.
- CPU-friendly: no GPU required for the typical document-card workload.
- Multilingual (`lang=latin` covers Spanish + English in a single recognizer).
- Deterministic plain-text output → reuses the existing `OcrTextParser`
  heuristics on the Java side untouched.

> LightOnOCR was evaluated and discarded: it is a 1B-parameter vision-language
> transformer that overlaps with what Gemini already does, and needs a GPU
> to be practical. PaddleOCR is the right shape for a *fallback*: lightweight,
> deterministic, offline.

## API

| Method | Path     | Description                                              |
|--------|----------|----------------------------------------------------------|
| GET    | `/health` | Liveness + active language / GPU flag.                  |
| POST   | `/ocr`    | Multipart `file` upload → `{ text, lines[], averageConfidence }`. |

## Configuration

| Env var       | Default | Notes                                                |
|---------------|---------|------------------------------------------------------|
| `OCR_LANGUAGE`| `latin` | PaddleOCR `lang` code: `latin`, `es`, `en`, `ch`, ...|
| `OCR_USE_GPU` | `false` | Enable only on machines with CUDA + paddlepaddle-gpu.|

## Run standalone

```bash
docker build -t scantral-paddleocr .
docker run --rm -p 8001:8001 scantral-paddleocr
curl -F "file=@some-receipt.jpg" http://localhost:8001/ocr
```

In the full stack it is wired up automatically by `docker-compose.yml`.
