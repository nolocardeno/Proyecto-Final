# PaddleOCR sidecar — modern OCR fallback for the Scantral backend.
# CPU-only image. For GPU, swap the base for paddlepaddle-gpu wheels.
FROM python:3.11-slim

WORKDIR /app

# System libs required by OpenCV / PaddlePaddle wheels at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgomp1 \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY app.py ./

# PaddleOCR caches model weights here on first run.
ENV HOME=/app
ENV PADDLEOCR_HOME=/app/.paddleocr

EXPOSE 8001

# Healthcheck. `start-period` is generous because the very first run has to
# download ~16 MB of PP-OCR weights from a slow CDN before /health responds.
# Subsequent starts are instantaneous thanks to the persisted model volume.
HEALTHCHECK --interval=15s --timeout=5s --start-period=300s --retries=5 \
    CMD python -c "import urllib.request,sys; \
urllib.request.urlopen('http://localhost:8001/health', timeout=3); \
sys.exit(0)" || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
