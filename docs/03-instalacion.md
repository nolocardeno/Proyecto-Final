# 3. Manual de instalación y puesta en marcha

## Índice

- [3.1. Requisitos previos](#31-requisitos-previos)
  - [Software obligatorio](#software-obligatorio)
  - [Recursos de hardware recomendados](#recursos-de-hardware-recomendados)
  - [Herramientas opcionales para desarrollo local](#herramientas-opcionales-para-desarrollo-local)
- [3.2. Estructura del proyecto y servicios](#32-estructura-del-proyecto-y-servicios)
- [3.3. Dockerfiles](#33-dockerfiles-y-scripts-de-construcción)
  - [Backend — `backend/Dockerfile`](#backend--backenddockerfile)
  - [Frontend — `frontend/Dockerfile`](#frontend--frontenddockerfile)
  - [Sidecar OCR — `paddleocr-service/Dockerfile`](#sidecar-ocr--paddleocr-servicedockerfile)
  - [Dependencias Python — `paddleocr-service/requirements.txt`](#dependencias-python--paddleocr-servicerequirementstxt)
- [3.4. Variables de entorno](#34-variables-de-entorno)
  - [Creación del fichero `.env`](#creación-del-fichero-env)
  - [Tabla de variables](#tabla-de-variables)
- [3.5. Instalación y arranque con Docker Compose](#35-instalación-y-arranque-con-docker-compose)
  - [Paso 1 — Clonar el repositorio](#paso-1--clonar-el-repositorio)
  - [Paso 2 — Configurar las variables de entorno](#paso-2--configurar-las-variables-de-entorno)
  - [Paso 3 — Construir e iniciar los contenedores](#paso-3--construir-e-iniciar-los-contenedores)
  - [Paso 4 — Esperar a que los servicios estén listos](#paso-4--esperar-a-que-los-servicios-estén-listos)
- [3.6. Verificación de la instalación](#36-verificación-de-la-instalación)
- [3.7. Ejecución en modo desarrollo (sin Docker)](#37-ejecución-en-modo-desarrollo-sin-docker)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Sidecar OCR](#sidecar-ocr)
- [3.8. Desinstalación y limpieza](#38-desinstalación-y-limpieza)

---

## 3.1. Requisitos previos

### Software obligatorio

El despliegue completo de Scantral se realiza mediante Docker Compose. No es necesario tener instalado Java, Node.js ni Python en la máquina anfitriona; las imágenes de los contenedores incluyen todas las dependencias.

| Software | Versión mínima recomendada | Observaciones |
|---|---|---|
| **Docker Engine** | ≥ 24.0 | Incluye el demonio y el CLI de Docker |
| **Docker Compose** | v2 (`docker compose`) | Integrado en Docker Desktop desde v4.x |
| **Git** | ≥ 2.30 | Necesario para clonar el repositorio |

Para verificar las versiones instaladas:

```bash
docker --version
docker compose version
git --version
```

### Recursos de hardware recomendados

| Recurso | Mínimo | Recomendado |
|---|---|---|
| RAM | 3 GB libres | 4 GB libres |
| Disco | 3 GB | 5 GB (imágenes + volúmenes + caché de build) |
| Conectividad | Salida a Internet la primera vez | — |

La primera ejecución requiere acceso a Internet para descargar las imágenes base de Docker Hub y los pesos del modelo PP-OCRv4 (~16 MB desde los servidores de PaddlePaddle). A partir de la segunda ejecución, todo queda en caché local.

El servicio PaddleOCR se ejecuta en modo **CPU** exclusivamente (`OCR_USE_GPU=false`); no se requiere ninguna GPU ni driver CUDA.

### Herramientas opcionales para desarrollo local

Estas herramientas solo son necesarias si se desea ejecutar alguno de los servicios fuera de Docker (véase la [sección 3.6](#36-ejecución-en-modo-desarrollo-sin-docker)):

| Herramienta | Versión | Uso |
|---|---|---|
| JDK Eclipse Temurin | 21 (LTS) | Ejecutar el backend Spring Boot localmente |
| Apache Maven | ≥ 3.9 | Gestión de dependencias del backend (o usar `./mvnw` incluido) |
| Node.js | 22 (LTS) | Ejecutar el frontend Angular localmente |
| npm | ≥ 10 | Gestor de paquetes de Node (incluido con Node) |
| Python | 3.11 | Ejecutar el sidecar OCR localmente |

---

## 3.2. Estructura del proyecto y servicios

El stack de Scantral está compuesto por cuatro servicios orquestados con Docker Compose. Todos ellos se comunican a través de la red interna `scantral-net`; únicamente el servicio `frontend` publica un puerto al host.

```
Navegador
    │  HTTP :4200
    ▼
frontend  (nginx:alpine + Angular SPA)
    │ /api/* y /uploads/*
    ▼
backend  (eclipse-temurin:21-jre + Spring Boot 4)
    ├── JDBC :5432 ──▶  postgres  (PostgreSQL 17)
    └── HTTP :8001 ──▶  paddleocr  (Python 3.11 + FastAPI + PaddleOCR PP-OCRv4)
```

| Servicio | Imagen base | Puerto host | Puerto interno | Rol |
|---|---|:---:|:---:|---|
| `frontend` | `nginx:alpine` | **4200** | 80 | Sirve la SPA Angular y hace reverse proxy de `/api` y `/uploads` al backend |
| `backend` | `eclipse-temurin:21-jre` | — | 8080 | API REST, lógica de negocio, autenticación JWT |
| `paddleocr` | `python:3.11-slim` | — | 8001 | Sidecar de OCR basado en PaddleOCR PP-OCRv4 (CPU) |
| `postgres` | `postgres:17` | — | 5432 | Base de datos relacional; datos persistidos en el volumen `pgdata` |

Los tres volúmenes Docker gestionados por el compose son:

- **`pgdata`** — datos de PostgreSQL.
- **`uploads`** — imágenes de documentos subidas por los usuarios.
- **`paddleocr_models`** — pesos del modelo PP-OCR descargados en el primer arranque.

---

## 3.3. Dockerfiles

Cada uno de los tres servicios personalizados dispone de su propio `Dockerfile` en el repositorio. Los tres utilizan el patrón de **build multietapa**: una primera etapa compila o empaqueta la aplicación y una segunda etapa copia únicamente los artefactos necesarios sobre una imagen de ejecución más ligera, reduciendo el tamaño final de la imagen y la superficie de ataque.

### Backend — `backend/Dockerfile`

```dockerfile
# Build
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY src src
RUN ./mvnw package -DskipTests -B

# Run
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- **Etapa `build`**: imagen `eclipse-temurin:21-jdk`. Precarga las dependencias Maven (`dependency:go-offline`) en una capa separada para aprovechar la caché de Docker; luego compila el proyecto con `mvnw package -DskipTests`.
- **Etapa de ejecución**: imagen ligera `eclipse-temurin:21-jre` (sin compilador). Copia únicamente el JAR resultante. Expone el puerto 8080.

### Frontend — `frontend/Dockerfile`

```dockerfile
# Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Run
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- **Etapa `build`**: imagen `node:22-alpine`. Instala dependencias con `npm ci` (instalación reproducible desde `package-lock.json`) y ejecuta la compilación de producción de Angular.
- **Etapa de ejecución**: imagen `nginx:alpine`. Copia los estáticos compilados y la configuración de nginx que establece el reverse proxy hacia el backend. Expone el puerto 80 (publicado como 4200 en el host mediante Docker Compose).

### Sidecar OCR — `paddleocr-service/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

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

ENV HOME=/app
ENV PADDLEOCR_HOME=/app/.paddleocr

EXPOSE 8001

HEALTHCHECK --interval=15s --timeout=5s --start-period=300s --retries=5 \
    CMD python -c "import urllib.request,sys; \
urllib.request.urlopen('http://localhost:8001/health', timeout=3); \
sys.exit(0)" || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
```

- Imagen base `python:3.11-slim`. Instala las bibliotecas de sistema necesarias para OpenCV y PaddlePaddle (libGL, libglib2, etc.).
- Los pesos del modelo se guardan en `PADDLEOCR_HOME=/app/.paddleocr`, que corresponde al volumen Docker `paddleocr_models` montado por el compose.
- El `HEALTHCHECK` tiene un `start-period` de 300 segundos para contemplar la descarga del modelo en el primer arranque. En arranques posteriores el contenedor alcanza el estado `healthy` en segundos gracias al volumen persistente.

### Dependencias Python — `paddleocr-service/requirements.txt`

```text
fastapi==0.115.6
uvicorn[standard]==0.32.1
python-multipart==0.0.20
pillow==11.0.0
numpy<2
paddleocr==2.8.1
paddlepaddle==2.6.2
```

Todas las versiones están fijadas exactamente para garantizar la reproducibilidad de la instalación.

---

## 3.4. Variables de entorno

La configuración sensible y dependiente del entorno se inyecta al stack a través de un fichero `.env` ubicado en la raíz del repositorio. Este fichero **no se incluye en el repositorio** (está en `.gitignore`) para evitar la exposición de credenciales.

### Creación del fichero `.env`

El repositorio incluye un fichero de plantilla `.env.example` con todos los valores documentados. El proceso de creación es:

```bash
cp .env.example .env
```

A continuación, editar `.env` y rellenar los valores marcados como **obligatorios**.

### Tabla de variables

La columna *Por defecto* indica el valor que toma la variable si no se define en `.env`. Las variables sin valor por defecto marcadas como obligatorias provocarán un funcionamiento degradado o el fallo del servicio correspondiente si se omiten.

| Variable | Servicio | Obligatoria | Por defecto | Descripción |
|---|---|:---:|---|---|
| `POSTGRES_DB` | `postgres`, `backend` | No | `scantral` | Nombre de la base de datos |
| `POSTGRES_USER` | `postgres`, `backend` | No | `scantral` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | `postgres`, `backend` | No | `scantral_dev` | Contraseña de PostgreSQL |
| `JWT_SECRET` | `backend` | **Sí** ⚠ | `dev-only-change-me-…` | Secreto HMAC-SHA256 para firmar tokens JWT. Mínimo 32 bytes. El valor por defecto **no es seguro para producción**. |
| `JWT_EXPIRATION_MS` | `backend` | No | `86400000` | Tiempo de vida del token JWT en milisegundos (24 h) |
| `RESEND_API_KEY` | `backend` | No | *(vacío)* | API key de [Resend](https://resend.com) para el envío de alertas de caducidad. Si está vacía, el envío queda deshabilitado |
| `MAIL_FROM` | `backend` | No | `no-reply@scantral.local` | Dirección remitente. Debe pertenecer a un dominio verificado en Resend (p.ej. `alertas@tudominio.com`) |
| `GOOGLE_API_KEY` | `backend` | No | *(vacío)* | Clave de Google AI Studio para el extractor IA (Gemini). Si está vacía, el pipeline cae directamente al sidecar OCR |
| `AI_MODEL` | `backend` | No | `gemini-2.5-flash-lite` | Identificador del modelo Gemini a utilizar |
| `OCR_LANGUAGE` | `paddleocr` | No | `latin` | Idioma del modelo PP-OCR. `latin` cubre español e inglés |
| `OCR_TIMEOUT_MS` | `backend` | No | `30000` | Timeout HTTP (ms) del backend al sidecar OCR |

> **Nota sobre `JWT_SECRET`:** aunque tiene un valor por defecto funcional para desarrollo local, debe ser reemplazado por un secreto generado aleatoriamente en cualquier entorno distinto a un equipo de desarrollo personal. Se puede generar uno con:
>
> ```bash
> openssl rand -base64 48
> ```

> **Nota sobre `RESEND_API_KEY` / `MAIL_FROM`:** el envío de correo se realiza a través del relay SMTP de [Resend](https://resend.com) (`smtp.resend.com:587`). Para usarlo es necesario (1) crear una API key en el panel de Resend, (2) añadir y verificar el dominio que aparecerá como remitente mediante los registros DNS (SPF/DKIM) que Resend indica. El usuario SMTP es la cadena literal `resend` y la contraseña es la API key — ambos valores ya están cableados en `application.properties`, por lo que solo se necesita definir las dos variables anteriores.

---

## 3.5. Instalación y arranque con Docker Compose

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/nolocardeno/Scantral.git
cd Scantral
```

### Paso 2 — Configurar las variables de entorno

```bash
cp .env.example .env
```

Abrir `.env` con cualquier editor de texto y revisar como mínimo el valor de `JWT_SECRET`. Si se desea habilitar la extracción IA, añadir también `GOOGLE_API_KEY`. Para habilitar las alertas por correo, definir `RESEND_API_KEY` y `MAIL_FROM` (esta última debe ser una dirección de un dominio verificado en Resend).

### Paso 3 — Construir e iniciar los contenedores

```bash
docker compose up --build -d
```

Este comando construye las imágenes de los tres servicios personalizados (`backend`, `frontend`, `paddleocr`) y levanta los cuatro contenedores en segundo plano. La primera ejecución requiere varios minutos por los siguientes motivos:

- El backend descarga las dependencias Maven (~200 MB).
- El frontend ejecuta `npm ci` y la compilación de producción de Angular.
- El sidecar OCR instala PaddlePaddle y sus dependencias de sistema.

Las builds posteriores reutilizan la caché de Docker y son significativamente más rápidas.

### Paso 4 — Esperar a que los servicios estén listos

El servicio `paddleocr` descarga los pesos del modelo PP-OCRv4 (~16 MB) en el **primer arranque**. El healthcheck del contenedor está configurado con un periodo de inicio de 300 segundos para contemplar esta descarga. Durante este tiempo, el servicio aparece con estado `starting` en `docker compose ps`, lo cual es el comportamiento esperado.

Para comprobar el estado de todos los servicios:

```bash
docker compose ps
```

El estado esperado una vez que todos los servicios están operativos es:

```
NAME                  STATUS
scantral-db           Up (healthy)
scantral-paddleocr    Up (healthy)
scantral-backend      Up
scantral-frontend     Up
```

Para seguir los logs de arranque del backend:

```bash
docker compose logs -f backend
```

El backend está operativo cuando aparece la línea:

```
Started BackendDelProyectoFinalApplication in X.XXX seconds
```

Para el sidecar OCR:

```bash
docker compose logs paddleocr | tail -n 5
```

Salida esperada:

```
INFO     PaddleOCR ready: lang=latin, gpu=False
INFO     Uvicorn running on http://0.0.0.0:8001
```

---

## 3.6. Verificación de la instalación

Una vez que todos los contenedores están en estado `Up`, acceder desde el navegador a:

```
http://localhost:4200
```

La página de inicio de Scantral debe cargarse correctamente. Para confirmar que el backend responde a través del reverse proxy de nginx:

```bash
curl -i http://localhost:4200/api/documents
```

La respuesta esperada es un código `401 Unauthorized` con cuerpo JSON, lo que confirma que la petición llegó al backend (y no devolvió un 404 o 502 de nginx):

```
HTTP/1.1 401
Content-Type: application/json
{"error":"Token JWT ausente o inválido"}
```

Para verificar que la documentación OpenAPI está disponible:

```
http://localhost:4200/swagger-ui/index.html
```

> Para instrucciones de verificación más detalladas (registro y login mediante `curl`, smoke test del rate limiter, comprobación del sidecar OCR desde dentro de la red), consultar el fichero [DEPLOY.md](../DEPLOY.md), sección 4.

---

## 3.7. Ejecución en modo desarrollo (sin Docker)

Esta sección describe cómo ejecutar cada servicio fuera de Docker para facilitar el ciclo de desarrollo. Se recomienda mantener el servicio `paddleocr` y `postgres` en Docker incluso en desarrollo, ya que no tienen dependencias de código que cambien frecuentemente.

### Backend

Requisitos: JDK Eclipse Temurin 21 y PostgreSQL accesible en `localhost:5432`.

```bash
cd backend
./mvnw spring-boot:run
```

El Maven Wrapper (`mvnw`) incluido en el repositorio descarga automáticamente la versión correcta de Maven si no está instalada. El backend se conecta a la base de datos con los valores definidos en `backend/src/main/resources/application.properties` (por defecto: `localhost:5432/scantral`, usuario `scantral`, contraseña `scantral_dev`).

Para levantar únicamente PostgreSQL y el sidecar OCR con Docker mientras se ejecuta el backend en local:

```bash
docker compose up -d postgres paddleocr
```

### Frontend

Requisitos: Node.js 22 (LTS) y npm ≥ 10.

```bash
cd frontend
npm install
npm start
```

El comando `npm start` ejecuta `ng serve`, que levanta un servidor de desarrollo en `http://localhost:4200`. El fichero `proxy.conf.json` incluido en el repositorio redirige automáticamente las peticiones a `/api` al backend en `localhost:8080`, por lo que no es necesario modificar ninguna configuración de CORS.

Las versiones exactas de las dependencias de Angular utilizadas en el proyecto son:

- Angular: 20.3.x
- TypeScript: 5.9.x
- Node.js: 22 (imagen Docker de referencia: `node:22-alpine`)

### Sidecar OCR

Se recomienda ejecutar el sidecar OCR siempre mediante Docker, dado que PaddlePaddle y sus dependencias de sistema (`libgl1`, `libglib2.0-0`, etc.) son complejas de instalar en entornos locales:

```bash
docker compose up -d paddleocr
```

Si aun así se desea ejecutarlo en local, los requisitos son Python 3.11 y las dependencias de `paddleocr-service/requirements.txt`:

```bash
cd paddleocr-service
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001
```

---

## 3.8. Desinstalación y limpieza

Para detener todos los contenedores sin eliminar los datos:

```bash
docker compose down
```

Para detener los contenedores y **eliminar todos los volúmenes** (base de datos, imágenes de documentos y pesos del modelo OCR):

```bash
docker compose down -v
```

> ⚠ El comando `docker compose down -v` es irreversible. Elimina permanentemente todos los datos de usuario almacenados en los volúmenes `pgdata` y `uploads`, así como los pesos descargados en `paddleocr_models`.

Para eliminar adicionalmente las imágenes construidas localmente y forzar una reconstrucción completa en el próximo arranque:

```bash
docker image rm scantral-backend scantral-frontend scantral-paddleocr
```
