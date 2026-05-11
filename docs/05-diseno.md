# 5. Diseño

## Índice

- [5.1. Diagrama entidad-relación](#51-diagrama-entidad-relación)
  - [Entidades y atributos](#entidades-y-atributos)
  - [Relaciones](#relaciones)
- [5.2. Diagrama de casos de uso](#52-diagrama-de-casos-de-uso)
- [5.3. Diagramas de flujo de los procesos principales](#53-diagramas-de-flujo-de-los-procesos-principales)
  - [Flujo 1 — Subida de documento desde imagen](#flujo-1--subida-de-documento-desde-imagen)
  - [Flujo 2 — Envío de alertas](#flujo-2--envío-de-alertas)
  - [Flujo 3 — Gestión de grupos](#flujo-3--gestión-de-grupos)
  - [Flujo 4 — Validador de documentos](#flujo-4--validador-de-documentos)
- [5.4. Arquitectura de la aplicación](#54-arquitectura-de-la-aplicación)
  - [Visión general](#visión-general)
  - [Frontend — Angular SPA](#frontend--angular-spa)
  - [Backend — Spring Boot API](#backend--spring-boot-api)
  - [Servicio OCR — PaddleOCR sidecar](#servicio-ocr--paddleocr-sidecar)
  - [Base de datos — PostgreSQL](#base-de-datos--postgresql)
  - [Comunicación entre capas](#comunicación-entre-capas)
- [5.5. Diseño de la API REST](#55-diseño-de-la-api-rest)
  - [Autenticación](#autenticación)
  - [Documentos](#documentos)
  - [Alertas de documentos](#alertas-de-documentos)
  - [Grupos](#grupos)
  - [Usuarios](#usuarios)
  - [Dashboard](#dashboard)
  - [Procesamiento de imágenes](#procesamiento-de-imágenes)
  - [Administración](#administración)
  - [Convenciones generales](#convenciones-generales)

---

## 5.1. Diagrama entidad-relación

A continuación se describe el modelo de datos real tal como está implementado en la base de datos PostgreSQL, mapeado mediante JPA/Hibernate.

![Diagrama entidad-relación de Scantral](assets/diagrama-E-R.png)
_Diagrama entidad-relación completo de la base de datos de Scantral._

---

### Entidades y atributos

**User** — tabla `users`

| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-increment |
| email | varchar | NOT NULL, UNIQUE |
| password_hash | varchar | NOT NULL |
| name | varchar | NOT NULL |
| profile_image_path | varchar | nullable |
| role | varchar | NOT NULL, default `USER`; enum: `USER`, `ADMIN` |
| created_at | datetime | NOT NULL, inmutable |

---

**Document** — tabla `documents`

| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-increment |
| user_id | bigint | FK → users, NOT NULL |
| type | varchar | NOT NULL; enum: `DNI`, `PASSPORT`, `DRIVING_LICENSE`, `INSURANCE`, `ITV`, `RECEIPT`, `WARRANTY`, `INVOICE`, `OTHER` |
| kind | varchar | nullable (ticket / documento oficial) |
| title | varchar | NOT NULL |
| category | varchar | nullable |
| store_name | varchar | nullable |
| amount | decimal(10,2) | nullable |
| issue_date | date | nullable |
| expiry_date | date | nullable |
| image_path | varchar | nullable |
| extracted_data | text | nullable (JSON con datos extraídos por OCR/IA) |
| ai_processed | boolean | default false |
| notes | text | nullable |
| status | varchar | NOT NULL, default `ACTIVE`; enum: `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `RENEWED` |
| is_duplicate_of | bigint | FK → documents (auto-referencia), nullable |
| created_at | datetime | NOT NULL, inmutable |
| updated_at | datetime | nullable |

---

**DocumentAlert** — tabla `document_alerts`

| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-increment |
| document_id | bigint | FK → documents, NOT NULL |
| user_id | bigint | FK → users, NOT NULL |
| days_before_expiry | int | NOT NULL |
| notified_at | datetime | nullable (fecha del último envío) |
| created_at | datetime | NOT NULL, inmutable |

Constraint única: `(document_id, user_id, days_before_expiry)` — no se puede crear la misma alerta dos veces para el mismo documento y usuario.

---

**DocumentHistory** — tabla `document_history`

| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-increment |
| document_id | bigint | FK → documents, NOT NULL |
| user_id | bigint | FK → users (changedBy), NOT NULL |
| change_type | varchar | NOT NULL; enum: `CREATED`, `UPDATED`, `IMAGE_UPLOADED`, `RENEWED`, `DATES_UPDATED` |
| description | text | nullable |
| changed_at | datetime | NOT NULL, inmutable |

---

**RenewalHistory** — tabla `renewal_history`

| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-increment |
| document_id | bigint | FK → documents, NOT NULL |
| previous_expiry_date | date | NOT NULL |
| new_expiry_date | date | NOT NULL |
| renewed_at | datetime | NOT NULL |
| notes | text | nullable |

---

**DocumentGroup** — tabla `document_groups`

| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint | PK, auto-increment |
| name | varchar | NOT NULL |
| description | varchar | nullable |
| access_code | varchar(10) | UNIQUE |
| creator_id | bigint | FK → users, NOT NULL |
| all_can_add_documents | boolean | NOT NULL, default true |
| created_at | datetime | NOT NULL, inmutable |
| updated_at | datetime | nullable |

---

**group_members** — tabla de unión N:M (User ↔ DocumentGroup)

| Campo | Tipo |
|---|---|
| group_id | bigint (FK → document_groups) |
| user_id | bigint (FK → users) |

---

**group_documents** — tabla de unión N:M (Document ↔ DocumentGroup)

| Campo | Tipo |
|---|---|
| group_id | bigint (FK → document_groups) |
| document_id | bigint (FK → documents) |

---

### Relaciones

```
User           1 ──< N   Document
User           1 ──< N   DocumentAlert
User           1 ──< N   DocumentHistory   (changedBy)
User           N >──< N  DocumentGroup     (via group_members)
Document       1 ──< N   DocumentAlert
Document       1 ──< N   DocumentHistory
Document       1 ──< N   RenewalHistory
Document       0..1 ──   Document          (is_duplicate_of, auto-referencia)
Document       N >──< N  DocumentGroup     (via group_documents)
DocumentGroup  N ──< 1   User              (creator_id)
```

---

## 5.2. Diagrama de casos de uso

![Diagrama de casos de uso de Scantral](assets/diagrama-casos-uso.png)
_Diagrama de casos de uso con los tres actores y todas las funcionalidades del sistema._

> **Diagrama de casos de uso (formato Mermaid).** El bloque de código siguiente es la representación textual del diagrama. Se visualiza correctamente en **GitHub**, **GitLab**, **VS Code** (con la extensión Markdown Preview Mermaid Support) y cualquier visor de Markdown con soporte para Mermaid.

```mermaid
flowchart LR
    USUARIO["👤 Usuario"]
    SISTEMA["⚙️ Sistema"]
    EXTERNOS["🌐 Servicios externos\nGemini · Google Cal · Outlook"]

    subgraph SYS["Scantral"]
        direction TB

        subgraph AUTH["Autenticación"]
            UC1(["Registrarse"])
            UC2(["Iniciar sesión"])
            UC3(["Cerrar sesión"])
            UC4(["Modificar ajustes de cuenta"])
        end

        subgraph DOCS["Gestión de documentos"]
            UC5(["Añadir manualmente"])
            UC6(["Añadir desde imagen"])
            UC7(["Extraer texto · OCR"])
            UC8(["Analizar con IA"])
            UC9(["Editar documento"])
            UC10(["Eliminar documento"])
            UC11(["Renovar documento"])
            UC12(["Ver detalle del documento"])
            UC13(["Buscar y filtrar"])
            UC14(["Ver historial de cambios"])
            UC15(["Ver historial de renovaciones"])
        end

        subgraph ALERT["Alertas"]
            UC16(["Configurar alerta de caducidad"])
            UC17(["Eliminar alerta"])
            UC18(["Enviar correo automático"])
        end

        subgraph GRP["Grupos compartidos"]
            UC19(["Crear grupo"])
            UC20(["Unirse por código de acceso"])
            UC21(["Ver documentos del grupo"])
            UC22(["Añadir documento al grupo"])
            UC23(["Abandonar grupo"])
            UC24(["Eliminar grupo"])
        end

        subgraph VAL["Validador"]
            UC25(["Comprobar vigencia de documento"])
        end

        subgraph EXP["Exportación"]
            UC26(["Exportar a Google Calendar"])
            UC27(["Exportar a Outlook"])
            UC28(["Descargar .ics"])
        end

        UC6 -- "«include»" --> UC7
        UC6 -. "«include» opcional" .-> UC8
    end

    USUARIO --- UC1
    USUARIO --- UC2
    USUARIO --- UC3
    USUARIO --- UC4
    USUARIO --- UC5
    USUARIO --- UC6
    USUARIO --- UC9
    USUARIO --- UC10
    USUARIO --- UC11
    USUARIO --- UC12
    USUARIO --- UC13
    USUARIO --- UC14
    USUARIO --- UC15
    USUARIO --- UC16
    USUARIO --- UC17
    USUARIO --- UC19
    USUARIO --- UC20
    USUARIO --- UC21
    USUARIO --- UC22
    USUARIO --- UC23
    USUARIO --- UC24
    USUARIO --- UC25
    USUARIO --- UC26
    USUARIO --- UC27
    USUARIO --- UC28
    SISTEMA --- UC18
    EXTERNOS -.- UC8
    EXTERNOS -.- UC26
    EXTERNOS -.- UC27
```
_Diagrama de casos de uso con los tres actores y todas las funcionalidades del sistema._

### Actores

- **Usuario** — actor principal. Representa a cualquier persona registrada en la aplicación.
- **Sistema** — actor secundario interno. Representa las tareas programadas del backend, como el envío automático de alertas por correo.
- **Servicios externos** — actor secundario externo. Engloba Gemini API (extracción IA), Google Calendar y Outlook (exportación de recordatorios).

### Casos de uso por módulo

**Autenticación**
- Registrarse
- Iniciar sesión
- Cerrar sesión
- Modificar ajustes de cuenta (nombre, contraseña, imagen de perfil, API key de Gemini, tema)

**Gestión de documentos**
- Añadir documento manualmente
- Añadir documento desde imagen *(incluye: Extraer texto con OCR; incluye opcionalmente: Analizar con IA)*
- Editar documento
- Eliminar documento
- Renovar documento
- Ver detalle del documento
- Buscar y filtrar documentos
- Ver historial de cambios
- Ver historial de renovaciones

**Alertas**
- Configurar alerta de caducidad (días antes de vencimiento)
- Eliminar alerta
- *(Sistema)* Enviar correo de alerta automáticamente

**Grupos compartidos**
- Crear grupo
- Unirse a grupo mediante código de acceso
- Ver documentos del grupo
- Añadir documento a un grupo
- Abandonar grupo
- Eliminar grupo *(solo creador)*

**Validador**
- Comprobar vigencia de un documento en una fecha futura

**Exportación**
- Exportar recordatorio a Google Calendar
- Exportar recordatorio a Outlook
- Descargar fichero `.ics`

---

## 5.3. Diagramas de flujo de los procesos principales

### Flujo 1 — Subida de documento desde imagen

![Diagrama de flujo — Subida de documento desde imagen](assets/flujo-subida-documento.png)
_Flujo completo del proceso de subida y extracción automática de un documento._

El proceso comienza cuando el usuario abre el asistente de subida y elige el método «Desde imagen». Una vez subido el archivo, el backend ejecuta PaddleOCR de forma local. Si la extracción tiene éxito, los campos se pre-rellenan en el formulario del paso 5; si falla, los campos quedan vacíos con un aviso. Si el usuario tiene la IA activada en sus ajustes, se realiza una segunda llamada a la API de Gemini que puede enriquecer o corregir los datos obtenidos por OCR. En ambos casos el usuario revisa el resultado antes de guardar. Justo antes de persistir el documento, el sistema comprueba si el hash de la imagen coincide con el de algún documento previo del usuario y muestra un aviso si detecta un posible duplicado.

### Flujo 2 — Envío de alertas

![Diagrama de flujo — Envío de alertas](assets/flujo-alertas.png)
_Flujo de la tarea programada de envío de correos de alerta._

Una tarea `@Scheduled` se ejecuta diariamente en el backend. Para cada documento con fecha de caducidad y alertas activas, calcula los días restantes hasta el vencimiento. Si coincide con alguno de los umbrales configurados (por defecto 1, 7 y 30 días) y no se ha enviado ya una notificación en el día actual, el sistema envía un correo al propietario del documento y registra la fecha de envío en el campo `notified_at`.

### Flujo 3 — Gestión de grupos

![Diagrama de flujo — Gestión de grupos](assets/flujo-grupos.png)
_Flujo de creación de un grupo y proceso de unión mediante código de acceso._

El creador del grupo introduce nombre y descripción; el sistema genera automáticamente un código de acceso único de 10 caracteres. Ese código se comparte con otros usuarios. Cuando un usuario introduce el código en la pantalla «Unirse a grupo», el backend verifica que el código existe y que el usuario no pertenece ya al grupo antes de añadirlo como miembro.

### Flujo 4 — Validador de documentos

![Diagrama de flujo — Validador](assets/flujo-validador.png)
_Flujo del validador de vigencia de documentos._

El usuario selecciona un documento de su biblioteca y una fecha de referencia (mediante un preset o un calendario). El frontend calcula si la fecha de caducidad del documento es anterior o posterior a la fecha seleccionada y muestra el resultado con código de color: verde si estará vigente, rojo si habrá caducado, y un aviso especial si el documento no tiene fecha de caducidad configurada.

---

## 5.4. Arquitectura de la aplicación

### Visión general

Scantral sigue una arquitectura cliente-servidor clásica compuesta por tres servicios desplegados mediante Docker Compose. Cada servicio tiene una responsabilidad única y se comunica con los demás a través de protocolos bien definidos.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (navegador)                  │
│              Angular SPA  ·  puerto 4200 / 80            │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/REST (JSON)
                           ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND  (Spring Boot 4 · Java 21)          │
│                       puerto 8080                        │
│                                                          │
│  AuthController  DocumentController  GroupController     │
│  UserController  DashboardController  AlertController    │
│  DocumentProcessingController  AdminController           │
│                                                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │   Services   │  │  Security (JWT) │  │ Scheduler  │  │
│  └──────────────┘  └─────────────────┘  └────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │            JPA / Hibernate                        │    │
│  └──────────────────────────────────────────────────┘    │
└────────┬─────────────────────────────┬───────────────────┘
         │ JDBC                        │ HTTP (multipart)
         ▼                             ▼
┌─────────────────┐        ┌──────────────────────────────┐
│   PostgreSQL    │        │  PaddleOCR sidecar (Python)  │
│   puerto 5432   │        │         puerto 8001           │
└─────────────────┘        └──────────────────────────────┘
```

### Frontend — Angular SPA

La interfaz de usuario es una Single Page Application construida con **Angular 20**. Usa componentes standalone, el router propio de Angular para la navegación entre vistas y señales reactivas (`Signal`) para la gestión de estado local. Las peticiones al backend se realizan a través de `HttpClient` con interceptores para inyectar automáticamente el token JWT en cada cabecera `Authorization`.

Las rutas principales de la aplicación son:

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `LandingComponent` | Página de inicio pública |
| `/login` | `LoginComponent` | Formulario de inicio de sesión |
| `/register` | `RegisterComponent` | Formulario de registro |
| `/dashboard` | `DashboardComponent` | Vista principal de documentos |
| `/documents/:id` | `DocumentDetailComponent` | Detalle de un documento |
| `/groups` | `GroupsComponent` | Listado de grupos |
| `/groups/:id` | `GroupDetailComponent` | Detalle de un grupo |
| `/validator` | `ValidatorComponent` | Validador de vigencia |
| `/settings` | `SettingsComponent` | Ajustes de cuenta |

### Backend — Spring Boot API

El backend está construido con **Spring Boot 4** y **Java 21**. Expone una API REST que consume el frontend. La capa de seguridad usa Spring Security con autenticación basada en JWT: cada petición autenticada lleva el token en la cabecera `Authorization: Bearer <token>`. Los tokens revocados (por cierre de sesión) se añaden a una lista negra en memoria hasta que caducan.

La estructura interna del backend sigue una arquitectura en capas:

- **Controller** — recibe la petición HTTP, valida la entrada y delega en el servicio correspondiente.
- **Service** — contiene la lógica de negocio. Es la única capa que accede al repositorio.
- **Repository** — interfaces JPA que encapsulan el acceso a PostgreSQL.
- **DTO** — objetos de transferencia de datos para las peticiones y respuestas de la API.
- **Model** — entidades JPA que mapean las tablas de la base de datos.
- **Security** — filtros JWT, `UserDetailsService`, configuración de CORS y rate limiting.

El backend también incluye una tarea `@Scheduled` en el `DocumentAlertService` que se ejecuta diariamente para enviar los correos de alerta de caducidad.

### Servicio OCR — PaddleOCR sidecar

El servicio de reconocimiento óptico de caracteres es un microservicio independiente escrito en **Python** con **FastAPI** que envuelve la librería **PaddleOCR**. Se ejecuta en el mismo entorno Docker que el backend y escucha en el puerto 8001.

El backend le envía la imagen del documento como `multipart/form-data` a `POST /ocr`. El sidecar devuelve el texto extraído en formato JSON. Al tratarse de un servicio local, las imágenes de los usuarios nunca salen del entorno de despliegue durante la extracción primaria, lo que garantiza la privacidad por diseño.

Si el sidecar no está disponible o devuelve un error, el pipeline del backend continúa sin OCR y usa los datos que tenga disponibles (o los de Gemini si está activado).

### Base de datos — PostgreSQL

Los datos se persisten en una base de datos **PostgreSQL**. El esquema lo gestiona Hibernate con `ddl-auto=update`, lo que significa que las tablas se crean o actualizan automáticamente al arrancar el backend si hay cambios en las entidades.

Los ficheros de imagen subidos por los usuarios se almacenan en un volumen de disco local montado en el contenedor del backend (`./uploads`), no en la base de datos.

### Comunicación entre capas

| Origen | Destino | Protocolo | Formato |
|---|---|---|---|
| Navegador | Backend | HTTP/HTTPS | JSON / multipart |
| Backend | PostgreSQL | JDBC | SQL |
| Backend | PaddleOCR sidecar | HTTP interno (Docker network) | multipart → JSON |
| Backend | Gemini API (opcional) | HTTPS | JSON |
| Backend | Cliente de correo | SMTP | MIME |

---

## 5.5. Diseño de la API REST

Todos los endpoints (salvo los de autenticación y la imagen de perfil) requieren autenticación mediante el header `Authorization: Bearer <token>`. Los errores siguen el formato estándar de Spring Boot con campos `timestamp`, `status`, `error` y `message`.

### Autenticación

Base URL: `/api/auth`

| Método | Endpoint | Auth | Body | Respuesta | Descripción |
|---|---|:---:|---|---|---|
| POST | `/register` | ❌ | `{ email, password, name }` | `201 AuthResponse` | Registra un nuevo usuario |
| POST | `/login` | ❌ | `{ email, password }` | `200 AuthResponse` | Inicia sesión y devuelve JWT |
| POST | `/logout` | ✅ | — | `204 No Content` | Invalida el token actual |

**AuthResponse:**
```json
{
  "userId": 1,
  "email": "usuario@email.com",
  "name": "Nombre",
  "profileImagePath": "/uploads/...",
  "role": "USER",
  "token": "eyJ..."
}
```

---

### Documentos

Base URL: `/api/documents`

| Método | Endpoint | Auth | Descripción |
|---|---|:---:|---|
| GET | `/` | ✅ | Lista todos los documentos del usuario |
| GET | `/search` | ✅ | Búsqueda paginada con filtros (`status`, `type`, `q`, `page`, `size`, `sort`) |
| GET | `/{id}` | ✅ | Obtiene el detalle de un documento |
| POST | `/` | ✅ | Crea un documento (multipart: `data` + `file` opcional) |
| PUT | `/{id}` | ✅ | Actualiza un documento (multipart: `data` + `file` opcional) |
| DELETE | `/{id}` | ✅ | Elimina un documento |
| POST | `/{id}/renew` | ✅ | Renueva un documento (`?newExpiryDate=YYYY-MM-DD`) |
| GET | `/{id}/renewals` | ✅ | Historial de renovaciones del documento |
| GET | `/{id}/history` | ✅ | Historial de cambios del documento |
| POST | `/{id}/image` | ✅ | Sube o reemplaza la imagen de un documento |
| POST | `/check-duplicates` | ✅ | Comprueba si existe un documento duplicado |
| POST | `/extract` | ✅ | Extrae datos de una imagen sin crear el documento |

**DocumentResponse:**
```json
{
  "id": 1,
  "type": "DNI",
  "title": "DNI - Manolo",
  "category": null,
  "storeName": null,
  "amount": null,
  "issueDate": "2020-01-15",
  "expiryDate": "2030-01-15",
  "daysRemaining": 1345,
  "imagePath": "/uploads/...",
  "aiProcessed": false,
  "notes": null,
  "status": "ACTIVE",
  "duplicateOfId": null,
  "createdAt": "2025-01-10T10:00:00",
  "updatedAt": null
}
```

---

### Alertas de documentos

Base URL: `/api/documents/{documentId}/alerts`

| Método | Endpoint | Auth | Body | Respuesta | Descripción |
|---|---|:---:|---|---|---|
| GET | `/` | ✅ | — | `200 List<AlertResponse>` | Lista las alertas del documento |
| POST | `/` | ✅ | `{ daysBeforeExpiry }` | `201 AlertResponse` | Crea una alerta |
| DELETE | `/{alertId}` | ✅ | — | `204 No Content` | Elimina una alerta |

**DocumentAlertResponse:**
```json
{
  "id": 3,
  "documentId": 1,
  "daysBeforeExpiry": 30,
  "notifiedAt": null,
  "createdAt": "2025-01-10T10:00:00"
}
```

---

### Grupos

Base URL: `/api/groups`

| Método | Endpoint | Auth | Body | Respuesta | Descripción |
|---|---|:---:|---|---|---|
| GET | `/` | ✅ | — | `200 List<GroupResponse>` | Lista los grupos del usuario |
| POST | `/` | ✅ | `{ name, description }` | `201 GroupResponse` | Crea un grupo |
| GET | `/{id}` | ✅ | — | `200 GroupResponse` | Obtiene un grupo |
| GET | `/{id}/detail` | ✅ | — | `200 GroupDetailResponse` | Detalle completo con miembros |
| DELETE | `/{id}` | ✅ | — | `204 No Content` | Elimina un grupo (solo creador) |
| POST | `/join` | ✅ | `{ accessCode }` | `200 GroupResponse` | Unirse a un grupo por código |
| DELETE | `/{id}/leave` | ✅ | — | `204 No Content` | Abandonar un grupo |
| GET | `/{id}/documents` | ✅ | — | `200 List<DocumentResponse>` | Documentos del grupo |
| POST | `/{id}/documents` | ✅ | multipart: `data` + `file` | `201 DocumentResponse` | Añade un documento al grupo |
| POST | `/{id}/documents/extract` | ✅ | multipart: `file` + `?useAi` | `201 DocumentResponse` | Extrae y añade desde imagen |

**GroupResponse:**
```json
{
  "id": 2,
  "name": "Familia García",
  "creatorId": 1,
  "allCanAddDocuments": true,
  "memberCount": 3,
  "documentCount": 7,
  "activeDocumentCount": 5,
  "expiredDocumentCount": 1,
  "memberPreviews": [...],
  "createdAt": "2025-02-01T09:00:00",
  "updatedAt": null
}
```

---

### Usuarios

Base URL: `/api/users`

| Método | Endpoint | Auth | Descripción |
|---|---|:---:|---|
| GET | `/{userId}` | ✅ | Obtiene los datos de un usuario (solo propio o admin) |
| PATCH | `/{userId}` | ✅ | Actualiza datos del usuario (nombre, contraseña, API key, tema) |
| DELETE | `/{userId}` | ✅ | Elimina la cuenta (solo propio o admin) |
| GET | `/{userId}/profile-image` | ❌ | Obtiene la imagen de perfil (pública, usada en `<img>`) |
| POST | `/{userId}/profile-image` | ✅ | Sube o reemplaza la imagen de perfil |

---

### Dashboard

Base URL: `/api/dashboard`

| Método | Endpoint | Auth | Respuesta | Descripción |
|---|---|:---:|---|---|
| GET | `/` | ✅ | `200 DashboardStats` | Estadísticas resumidas del usuario |

**DashboardStats:**
```json
{
  "totalDocuments": 12,
  "activeDocuments": 8,
  "expiringSoonDocuments": 2,
  "expiredDocuments": 2
}
```

---

### Procesamiento de imágenes

Base URL: `/api/documents/processing`

| Método | Endpoint | Auth | Body | Respuesta | Descripción |
|---|---|:---:|---|---|---|
| POST | `/analyze` | ❌* | multipart: `file` | `200 ProcessDocumentResponse` | Ejecuta el pipeline OCR+IA sobre una imagen |

> \* Este endpoint es llamado internamente por el propio backend durante la creación de documentos. No requiere autenticación propia porque se usa desde la capa de servicio.

---

### Administración

Base URL: `/api/admin` *(requiere rol `ADMIN`)*

| Método | Endpoint | Auth | Descripción |
|---|---|:---:|---|
| GET | `/users` | ✅ ADMIN | Listado paginado y filtrable de usuarios (`role`, `q`, `page`, `size`, `sort`) |

---
