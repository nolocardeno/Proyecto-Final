# 8. Despliegue

> **Documentos de referencia para la evaluación**
>
> Esta sección es el resumen de despliegue de la memoria. La guía paso a paso
> completa y los materiales de evaluación de la asignatura están en los documentos
> siguientes:
>
> | Documento | Contenido |
> | --------- | --------- |
> | [**DEPLOY.md**](../DEPLOY.md) | Guía de despliegue paso a paso: arranque, verificación con `curl`, troubleshooting, gestión de artefactos y verificación de red |
> | [**08-despliegue-eval.md**](08-despliegue-eval.md) | Evidencias de evaluación de la asignatura: criterios c1–c4, C7, C8 con capturas y comandos reales |

---

## Índice

- [8.1. Entorno de despliegue](#81-entorno-de-despliegue)
- [8.2. Arquitectura de contenedores](#82-arquitectura-de-contenedores)
- [8.3. Configuración de CI/CD](#83-configuración-de-cicd)
  - [8.3.1. Pipeline de integración continua (CI)](#831-pipeline-de-integración-continua-ci)
  - [8.3.2. Pipeline de publicación de imágenes (CD)](#832-pipeline-de-publicación-de-imágenes-cd)
- [8.4. Proceso de despliegue en producción](#84-proceso-de-despliegue-en-producción)
  - [8.4.1. Preparación del entorno](#841-preparación-del-entorno)
  - [8.4.2. Variables de entorno](#842-variables-de-entorno)
  - [8.4.3. Arranque del stack](#843-arranque-del-stack)
  - [8.4.4. Verificación funcional](#844-verificación-funcional)
- [8.5. URL de la aplicación en producción](#85-url-de-la-aplicación-en-producción)

---

## 8.1. Entorno de despliegue

Scantral se despliega en un **Droplet de DigitalOcean** (VPS Linux), sobre el
que corre Docker Engine con Docker Compose v2. Esta elección ofrece control
total sobre el entorno de ejecución con un coste predecible, a diferencia de
plataformas PaaS como Render o Railway que imponen restricciones sobre
contenedores con procesos pesados (PaddleOCR supera 1 GB de imagen y requiere
RAM suficiente para inferencia).

| Componente | Tecnología |
|---|---|
| Proveedor cloud | DigitalOcean (Droplet) |
| Sistema operativo | Ubuntu 24.04 LTS |
| Orquestación | Docker Compose v2 |
| Proxy HTTPS externo | Cloudflare (gestión de certificados TLS y CDN) |
| Registry de imágenes | Docker Hub (`nolorubio23/`) |
| CI/CD | GitHub Actions |

El dominio `scantral.com` apunta al Droplet a través de Cloudflare, que
termina TLS y reenvía las peticiones al puerto `4200` del host, donde escucha
el contenedor `scantral-frontend`.

---

## 8.2. Arquitectura de contenedores

El stack se compone de **4 servicios** en una red Docker interna
(`scantral-net`). El único servicio con puerto publicado al host es el
frontend; el resto sólo es alcanzable desde dentro de la red:

```
Navegador
    │ HTTPS :443
    ▼
Cloudflare (TLS termination)
    │ HTTP :4200
    ▼
┌─────────────────────────── scantral-net ──────────────────────────────┐
│                                                                        │
│   frontend (nginx:alpine)                                              │
│   ├── Sirve la SPA de Angular                                          │
│   ├── /api/* → proxy_pass http://backend:8080                         │
│   ├── /uploads/* → proxy_pass http://backend:8080                     │
│   └── /swagger-ui/, /v3/api-docs → proxy_pass http://backend:8080    │
│                     │                                                  │
│                     ▼                                                  │
│   backend (eclipse-temurin:21-jre)  ←──── postgres:17 (:5432)        │
│   ├── API REST + JWT                        pgdata (volumen)          │
│   ├── Lógica de negocio                                                │
│   └── OCR/IA → paddleocr (:8001)                                      │
│                     │                                                  │
│                     ├──── Google Gemini API (HTTPS saliente)          │
│                     └──── Gmail SMTP (alertas caducidad)              │
│                                                                        │
│   paddleocr (python:3.11-slim + FastAPI + PaddleOCR PP-OCRv4)        │
│   └── paddleocr_models (volumen, ~16 MB pesos)                        │
└────────────────────────────────────────────────────────────────────────┘
```

| Servicio | Imagen | Puerto host | Puerto interno |
|---|---|---|---|
| `frontend` | `nginx:alpine` | `4200` | `80` |
| `backend` | `eclipse-temurin:21-jre` | — | `8080` |
| `paddleocr` | `python:3.11-slim` | — | `8001` |
| `postgres` | `postgres:17` | — | `5432` |

**Nginx como reverse proxy unificado.** La configuración `nginx.conf` del
frontend reenvía `/api/` y `/uploads/` al backend por DNS interno de Docker
(`http://backend:8080`), eliminando la necesidad de exponer el puerto 8080 al
host. Además proxy-pasa `/swagger-ui/` y `/v3/api-docs` para que la
documentación OpenAPI sea accesible desde el dominio público:

```nginx
location /api/ {
    proxy_pass http://backend:8080;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://backend:8080;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

**Volúmenes persistentes.** Tres volúmenes con nombre sobreviven a
`docker compose down` (sólo se eliminan con `down -v`):

| Volumen | Servicio | Contenido |
|---|---|---|
| `pgdata` | postgres | Base de datos completa (usuarios, documentos, alertas) |
| `uploads` | backend | Imágenes de documentos subidas por los usuarios |
| `paddleocr_models` | paddleocr | Pesos PP-OCRv4 (~16 MB) cacheados para evitar re-descarga |

---

## 8.3. Configuración de CI/CD

### 8.3.1. Pipeline de integración continua (CI)

El workflow `.github/workflows/ci.yml` se activa en cada `push` a `main` y
en cada *pull request* contra `main`. Ejecuta **3 trabajos en paralelo**, uno
por capa del stack:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

**Trabajo `backend` (Spring Boot)**

Levanta un contenedor de servicio `postgres:17` con healthcheck y ejecuta
`./mvnw -B verify`, que compila, pasa las pruebas (94 tests) y genera el
informe JaCoCo:

```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_DB: scantral
      POSTGRES_USER: scantral
      POSTGRES_PASSWORD: scantral_dev
    options: >-
      --health-cmd "pg_isready -U scantral"
      --health-interval 5s
      --health-retries 10

steps:
  - uses: actions/setup-java@v4
    with:
      distribution: temurin
      java-version: '21'
      cache: maven
  - run: ./mvnw -B verify
```

**Trabajo `frontend` (Angular)**

Instala dependencias con `npm ci` (reproducible) y realiza un build de
producción que detecta errores de compilación TypeScript y plantillas:

```yaml
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: npm
  - run: npm ci
  - run: npm run build -- --configuration production
```

**Trabajo `ocr` (Python)**

Verifica la sintaxis del servicio PaddleOCR sin instalar las dependencias
pesadas (~1 GB), manteniendo el trabajo rápido:

```yaml
steps:
  - uses: actions/setup-python@v5
    with:
      python-version: '3.11'
  - run: python -m py_compile app.py
```

### 8.3.2. Pipeline de publicación de imágenes (CD)

El workflow `.github/workflows/docker-publish.yml` se activa en `push` a
`main`, en la creación de tags `v*` y manualmente (`workflow_dispatch`).
Usa una **matriz de 3 servicios** para construir y publicar en paralelo las
tres imágenes en Docker Hub:

```yaml
on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:

jobs:
  publish:
    strategy:
      matrix:
        service:
          - { name: scantral-backend,   context: ./backend }
          - { name: scantral-frontend,  context: ./frontend }
          - { name: scantral-paddleocr, context: ./paddleocr-service }
    steps:
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        with:
          tags: |
            type=ref,event=branch
            type=ref,event=tag
            type=sha,format=short
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

La caché de GitHub Actions (`type=gha`) evita reconstruir capas no
modificadas entre commits, reduciendo significativamente el tiempo de build.

Las imágenes publicadas son:

| Imagen | Registry | Tags |
|---|---|---|
| [`nolorubio23/scantral-frontend`](https://hub.docker.com/r/nolorubio23/scantral-frontend) | docker.io | `latest`, `main`, `sha-<corto>`, `v*` |
| [`nolorubio23/scantral-backend`](https://hub.docker.com/r/nolorubio23/scantral-backend) | docker.io | `latest`, `main`, `sha-<corto>`, `v*` |
| [`nolorubio23/scantral-paddleocr`](https://hub.docker.com/r/nolorubio23/scantral-paddleocr) | docker.io | `latest`, `main`, `sha-<corto>`, `v*` |

---

## 8.4. Proceso de despliegue en producción

### 8.4.1. Preparación del entorno

En el Droplet de DigitalOcean (Ubuntu 24.04), con Docker Engine y Docker
Compose v2 instalados, se clona el repositorio una sola vez:

```bash
git clone https://github.com/nolocardeno/Scantral.git
cd Scantral
```

En despliegues posteriores, basta con actualizar el código y reiniciar:

```bash
git pull origin main
docker compose up -d --build
```

Alternativamente, usando las imágenes ya publicadas en Docker Hub (sin
necesidad de recompilar en el servidor), se sustituye la directiva `build:`
por `image:` en el `docker-compose.yml`:

```yaml
backend:
  image: nolorubio23/scantral-backend:latest
```

Y se descarga la última versión con:

```bash
docker compose pull
docker compose up -d
```

### 8.4.2. Variables de entorno

Se copia la plantilla pública y se rellenan los valores reales. El fichero
`.env` está en `.gitignore` y nunca se versiona:

```bash
cp .env.example .env
nano .env
```

Variables obligatorias en producción:

```env
# Clave JWT — mínimo 32 bytes; generar con: openssl rand -base64 48
JWT_SECRET=<≥ 32 bytes aleatorios>

# Credenciales de base de datos (sobrescriben los defaults de desarrollo)
POSTGRES_DB=scantral
POSTGRES_USER=scantral
POSTGRES_PASSWORD=<contraseña segura>

# API de Google Gemini (extractor IA primario)
GOOGLE_API_KEY=<clave de la Google AI Studio>

# Resend para alertas de caducidad (opcional; si están vacías no se envían emails).
# Crear la API key en https://resend.com/api-keys y verificar previamente el
# dominio del remitente (registros SPF/DKIM en el DNS).
RESEND_API_KEY=<api-key de Resend>
MAIL_FROM=alertas@tudominio.com
```

Docker Compose inyecta las variables en cada contenedor mediante la sintaxis
`${VAR:-default}`, que define valores por defecto para entornos de desarrollo
sin `.env`:

```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB:-scantral}
  JWT_SECRET: ${JWT_SECRET:-dev-only-change-me-please-32-bytes-minimum-secret-key}
  GOOGLE_API_KEY: ${GOOGLE_API_KEY}
  OCR_SERVICE_URL: http://paddleocr:8001
```

### 8.4.3. Arranque del stack

```bash
docker compose up -d --build
```

La primera vez el proceso tarda varios minutos: Maven descarga dependencias,
`npm ci` instala paquetes de Angular y PaddleOCR descarga ~16 MB de pesos
desde su CDN. En arranques posteriores las capas de Docker y el volumen
`paddleocr_models` están cacheados.

Estado esperado tras el arranque:

```text
NAME                  IMAGE                STATUS
scantral-db           postgres:17          Up (healthy)
scantral-paddleocr    scantral-paddleocr   Up (healthy)
scantral-backend      scantral-backend     Up
scantral-frontend     scantral-frontend    Up          0.0.0.0:4200->80/tcp
```

El único puerto publicado al host es `4200/tcp`. Cloudflare recibe en `:443`
y reenvía al Droplet en `:4200`.

### 8.4.4. Verificación funcional

**Frontend y reverse proxy:**

```bash
# El frontend responde con la SPA de Angular
curl -I http://localhost:4200/
# HTTP/1.1 200 OK — Server: nginx/1.27.x

# El reverse proxy delega /api al backend (401 esperado sin token, no HTML)
curl -i http://localhost:4200/api/documents
# HTTP/1.1 401 — {"error":"Token JWT ausente o inválido"}
```

**Backend — registro y login:**

```bash
# Registro de usuario
curl -s -X POST http://localhost:4200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo","email":"demo@scantral.local","password":"Demo1234!"}'

# Login → captura el token JWT
TOKEN=$(curl -s -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@scantral.local","password":"Demo1234!"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Endpoint autenticado
curl -s http://localhost:4200/api/documents \
  -H "Authorization: Bearer $TOKEN"
```

**Sidecar OCR (desde dentro de la red interna):**

```bash
docker compose exec backend curl -s http://paddleocr:8001/health
# {"status":"ok","language":"latin","gpu":false}
```

**Documentación OpenAPI:**

La documentación Swagger está accesible a través del reverse proxy de Nginx,
sin exponer el puerto 8080 del backend:

- Spec JSON: `https://scantral.com/v3/api-docs`
- Swagger UI: `https://scantral.com/swagger-ui/index.html`

---

## 8.5. URL de la aplicación en producción

| Recurso | URL |
|---|---|
| Aplicación web | [https://scantral.com](https://scantral.com) |

**Recursos adicionales:**

| Recurso | URL |
|---|---|
| API REST (Swagger UI) | [https://scantral.com/swagger-ui/index.html](https://scantral.com/swagger-ui/index.html) |
| OpenAPI spec (JSON) | [https://scantral.com/v3/api-docs](https://scantral.com/v3/api-docs) |
| Docker Hub — frontend | [https://hub.docker.com/r/nolorubio23/scantral-frontend](https://hub.docker.com/r/nolorubio23/scantral-frontend) |
| Docker Hub — backend | [https://hub.docker.com/r/nolorubio23/scantral-backend](https://hub.docker.com/r/nolorubio23/scantral-backend) |
| Docker Hub — paddleocr | [https://hub.docker.com/r/nolorubio23/scantral-paddleocr](https://hub.docker.com/r/nolorubio23/scantral-paddleocr) |
| Repositorio GitHub | [https://github.com/nolocardeno/Scantral](https://github.com/nolocardeno/Scantral) |
