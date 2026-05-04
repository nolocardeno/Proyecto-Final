# Scantral — Sidecar PaddleOCR

Microservicio Python ligero que expone [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
(PP-OCRv4) por HTTP. Sustituye al fallback legacy de Tesseract / Tess4J utilizado por
el backend Spring cuando el extractor IA primario (Gemini) no está disponible.

## Índice

- [Por qué PaddleOCR](#por-qué-paddleocr)
- [API](#api)
- [Configuración](#configuración)
- [Ejecución en solitario](#ejecución-en-solitario)

## Por qué PaddleOCR

- Moderno (PP-OCRv4 / v5), con mucha mayor precisión que Tesseract en tickets y DNIs.
- Eficiente en CPU: no requiere GPU para la carga de trabajo habitual con documentos.
- Multilingüe (`lang=latin` cubre español + inglés en un único reconocedor).
- Salida en texto plano determinista → reutiliza las heurísticas existentes de `OcrTextParser`
  en el lado Java sin modificaciones.

> LightOnOCR fue evaluado y descartado: es un transformer visión-lenguaje de 1B parámetros
> que solapa con lo que Gemini ya hace y necesita GPU para ser práctico. PaddleOCR encaja
> mejor como *fallback*: ligero, determinista y sin conexión.

## API

| Método | Ruta      | Descripción                                                          |
|--------|-----------|----------------------------------------------------------------------|
| GET    | `/health` | Comprobación de vida + idioma activo / flag GPU.                     |
| POST   | `/ocr`    | Subida multipart `file` → `{ text, lines[], averageConfidence }`.    |

## Configuración

| Variable      | Por defecto | Notas                                                      |
|---------------|-------------|------------------------------------------------------------|
| `OCR_LANGUAGE`| `latin`     | Código de idioma PaddleOCR: `latin`, `es`, `en`, `ch`, … |
| `OCR_USE_GPU` | `false`     | Activar solo en máquinas con CUDA + paddlepaddle-gpu.      |

## Ejecución en solitario

```bash
docker build -t scantral-paddleocr .
docker run --rm -p 8001:8001 scantral-paddleocr
curl -F "file=@un-ticket.jpg" http://localhost:8001/ocr
```

En el stack completo se conecta automáticamente a través de `docker-compose.yml`.
