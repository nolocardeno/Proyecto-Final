# 6. Desarrollo

## Índice

- [6.1. Secuencia de desarrollo](#61-secuencia-de-desarrollo)
- [6.2. Dificultades encontradas y cómo se superaron](#62-dificultades-encontradas-y-cómo-se-superaron)
- [6.3. Decisiones técnicas clave y su justificación](#63-decisiones-técnicas-clave-y-su-justificación)
- [6.4. Control de versiones](#64-control-de-versiones)
- [6.5. Fragmentos de código relevantes](#65-fragmentos-de-código-relevantes)

---

## 6.1. Secuencia de desarrollo

El desarrollo de Scantral siguió un enfoque incremental, añadiendo capas de funcionalidad de forma progresiva sobre una base estructural sólida.

### Fase 1 — Diseño en Figma

Antes de escribir una sola línea de código se realizó el diseño completo de la aplicación en Figma: guía de estilos (paleta de colores, tipografía, espaciado), wireframes de estructura y mockups de alta fidelidad de todas las pantallas. Tomar estas decisiones visuales al principio permitió que el desarrollo posterior fuera más directo y con menos revisiones de diseño.

### Fase 2 — Estructura del proyecto e infraestructura base

Una vez cerrado el diseño, se creó la estructura de repositorio y los primeros ficheros de infraestructura: el proyecto Angular para el frontend, el proyecto Spring Boot para el backend, los Dockerfiles de ambos servicios y un Docker Compose provisional. También se definió el sistema de estilos global del frontend: variables SCSS, custom properties, reset, mixins y la arquitectura ITCSS de capas.

### Fase 3 — Componentes de layout y autenticación

Con la base en pie se construyeron los componentes de layout (header, sidebar, footer) y el sistema de autenticación completo: modales de login y registro, servicio HTTP de autenticación, persistencia de sesión y la lógica de backend con Spring Security.

### Fase 4 — Módulo de documentos

Se implementó el núcleo funcional de la aplicación: modelo de datos de documentos, endpoints REST, servicio de documentos del frontend, páginas de dashboard y listado, y los componentes de tarjeta de documento, búsqueda y filtros. Se añadió también la subida manual de imágenes y la página de detalle de documento con sus acciones (editar, eliminar, exportar al calendario).

### Fase 5 — Pipeline de extracción automática (OCR + IA)

Se creó el microservicio PaddleOCR, se integró en Docker Compose con su volumen y healthcheck, y se implementó la pipeline completa de procesado: cliente Java para PaddleOCR, dispatcher con fallback a IA (Gemini), parser de texto plano a campos estructurados, motor de reglas y endpoint REST de procesado. La extracción por OCR tiene prioridad sobre la IA; si no está disponible, el sistema cae automáticamente al extractor por imagen de Gemini.

### Fase 6 — Módulo de grupos

Se implementó el sistema de grupos compartidos: modelo, repositorio, DTOs y controlador backend; servicio y páginas de frontend; componentes de tarjeta de grupo, lista de miembros, código de acceso, modal de creación y modal de unión por código.

### Fase 7 — Alertas, historial y validador

Se añadieron las alertas de caducidad con envío por email (Spring Mail + plantilla HTML), el historial de versiones de documentos, la página del validador de documentos oficiales y el componente de paginación reutilizable.

### Fase 8 — Calidad, accesibilidad y despliegue

Se completaron los tests unitarios de backend (JaCoCo > 80 %) y de frontend (Karma > 80 %), se implementó el diseño responsive desktop-first, la accesibilidad ARIA y navegación por teclado, el sistema de temas claro/oscuro con tokens CSS, mejoras de SEO (robots.txt, sitemap, OpenGraph) y el pipeline de CI/CD con GitHub Actions. Finalmente se hardeneó el Docker Compose (aislamiento de red, puertos mínimos expuestos, variables de entorno parametrizadas) y se redactó la documentación general del proyecto.

---

## 6.2. Dificultades encontradas y cómo se superaron

### Diseño de la pipeline OCR + IA con disponibilidad variable

Uno de los retos más complejos fue construir una pipeline de extracción que fuera resiliente a la indisponibilidad de cualquiera de sus dos motores. PaddleOCR requiere un tiempo de arranque de varios minutos la primera vez que se lanza (descarga de ~16 MB de pesos del modelo PP-OCRv4), y Gemini depende de una clave de API externa que puede no estar configurada. Si la lógica de selección de extractor estuviese distribuida por el código, cada punto de uso tendría que gestionar estos casos de error por separado.

Se diseñó un `ExtractionDispatcher` que centraliza toda la lógica de selección: por defecto usa OCR; si el usuario activa la extracción por IA, se intenta primero Gemini y, si falla o lanza una excepción, se hace fallback automático a OCR. Cada extractor queda completamente aislado detrás de la misma interfaz, y el dispatcher captura cualquier excepción del extractor de IA para que un fallo externo nunca interrumpa el flujo principal. Esto permitió además testear cada extractor de forma independiente.

### Parseo del texto bruto de PaddleOCR con tolerancia a artefactos

PaddleOCR no devuelve datos estructurados, sino texto plano concatenado donde los errores de reconocimiento son sistemáticos y predecibles: fechas pegadas a la hora del ticket (`07/02/201314:25`), separadores inconsistentes entre los componentes de una fecha (`07 de junio de 2012`, `07/Jun/2012`, `07-JUN-2012`), cifras monetarias con coma en lugar de punto, o líneas fusionadas por el modelo de detección. Escribir un parser que cubriese todos estos casos sin falsos positivos fue un trabajo iterativo y laborioso.

Se desarrolló `OcrTextParser` con un conjunto de expresiones regulares tolerantes cuidadosamente diseñadas. Para fechas, por ejemplo, se necesitaron tres patrones distintos: uno para el formato numérico con separadores variables, otro para meses en texto (español e inglés), y un tercero de tipo `SPACED_DATE` específico para los DNI españoles que el OCR tiende a reconocer como grupos de dígitos separados por espacios. La confianza de cualquier campo reconocido por esta vía se limitó intencionalmente a `0.6`, garantizando que el frontend siempre marque el resultado como pendiente de revisión manual y diferenciándolo visualmente del resultado de la IA.

### Conseguir que Gemini respondiera JSON puro y sin inventar datos

Integrar un modelo de lenguaje grande como extractor estructurado presentó dos problemas que no aparecen con una API convencional: las alucinaciones y el formato de respuesta. En los primeros intentos, Gemini tendía a envolver el JSON en bloques de código Markdown (````json … ````), lo que rompía el parseo. En otros casos inventaba campos que no eran legibles en la imagen, asignándoles valores plausibles pero incorrectos.

El esquema del prompt se refinó en múltiples iteraciones: se añadió la instrucción explícita de no incluir markdown, se forzó la respuesta con `responseMimeType: application/json` en los parámetros de generación y se estableció `temperature: 0` para minimizar la variabilidad. Para el campo `receiptCategory`, que clasifica los tickets en tres cubos legales (`garantia`, `devolucion`, `otro`), fue necesario incluir en el propio prompt las reglas de negocio con ejemplos de comercios representativos, ya que sin esa guía el modelo los clasificaba de forma inconsistente entre ejecuciones.

### Tiempo de arranque del sidecar PaddleOCR y gestión de peticiones tempranas

PaddleOCR necesita descargar e inicializar los pesos del modelo PP-OCRv4 la primera vez que arranca el contenedor, lo que en condiciones normales tarda entre dos y cinco minutos. Las peticiones que llegaban durante ese período de calentamiento recibían una respuesta vacía o un error de conexión que se propagaba al usuario como un fallo de procesado sin mensaje explicativo.

Se abordó en dos niveles: en el `docker-compose.yml` se configuró un healthcheck con un `start-period` generoso que impide que Docker marque el servicio como disponible hasta que el endpoint `/health` del sidecar responda correctamente. En el backend, `OcrDocumentExtractor` se construye con timeouts explícitos de conexión (10 s) y lectura (30 s) sobre el `RestClient`, y cualquier `ResourceAccessException` por sidecar inalcanzable se captura y traduce a un `ExtractionResult.FAILED` controlado en lugar de dejar la petición del usuario colgada o propagar una excepción genérica.

### Unificación del envío de imagen y metadatos en una sola petición

Durante el desarrollo inicial, la subida de la imagen y la creación del documento eran dos peticiones HTTP separadas: primero se subía el fichero y se obtenía una ruta, y después se enviaban los metadatos con esa ruta referenciada. Esto generaba un estado inconsistente cada vez que la segunda petición fallaba: el fichero quedaba almacenado en disco pero sin ningún documento asociado en base de datos, con el consiguiente coste en espacio y complejidad de limpieza.

Se rediseñó el endpoint para recibir una única petición `multipart/form-data` que transporta simultáneamente el fichero y los metadatos del documento. La pipeline de procesado (`DocumentProcessingPipeline`) almacena el fichero y crea el registro de base de datos en la misma transacción lógica, de modo que si cualquier paso falla el sistema no queda en un estado parcial.

### Corrección del modelo responsive: de mobile-first a desktop-first

La arquitectura de estilos se comenzó con un enfoque mobile-first, lo que era coherente con las convenciones habituales de CSS. Sin embargo, el diseño cerrado en Figma era desktop-first: todas las pantallas se habían diseñado y validado en resolución de escritorio, y las adaptaciones para pantallas más pequeñas eran variantes simplificadas de ese diseño base. Esto provocaba que los estilos de escritorio sobreescribieran continuamente los de móvil, resultando en comportamientos visuales incorrectos en resoluciones intermedias.

Fue necesario invertir el orden de todos los media queries del proyecto, cambiar las condiciones de `min-width` a `max-width` y revisar componente a componente los estilos afectados. La corrección fue sistemática y requirió validar cada pantalla en los cinco breakpoints definidos (320 px, 375 px, 768 px, 1024 px y 1280 px) antes de darse por cerrada.

### Autorización de acceso a documentos dentro de grupos

El modelo inicial de autorización era simple: un usuario puede acceder a un documento si es su propietario. Al introducir los grupos, un documento podía pertenecer a un grupo al que accedían otros usuarios, pero el guard de autorización del backend solo comprobaba la propiedad directa. El resultado era que los miembros del grupo podían ver la tarjeta del documento en la vista del grupo pero recibían un error 403 al intentar abrir su página de detalle.

Se amplió la lógica de validación de acceso para contemplar dos rutas de autorización: ser el propietario del documento, o pertenecer a algún grupo que contenga ese documento. La consulta añade un join a la tabla de grupos y verifica la membresía del usuario, manteniendo la restricción para usuarios sin ninguna relación con el documento.

### Eliminación en cascada sin dejar referencias huérfanas

A medida que el modelo de datos crecía —documentos, alertas, historial de versiones, grupos, miembros de grupo— las operaciones de borrado se volvían cada vez más frágiles. Borrar un documento dejaba alertas huérfanas en la tabla de alertas y entradas de historial sin documento padre. Borrar una cuenta de usuario podía dejar documentos sin propietario y grupos sin creador, lo que causaba errores de integridad referencial en la base de datos.

Se abordó en dos frentes: por un lado, se revisaron y configuraron correctamente las relaciones JPA con `CascadeType` y `orphanRemoval` donde el ciclo de vida de la entidad hija dependía completamente de la padre. Por otro, para los casos donde la relación era más laxa (por ejemplo, un documento que pertenece a un grupo pero existe con independencia de él), se añadió lógica explícita en los servicios para desligar las referencias antes de ejecutar el borrado, evitando depender únicamente del comportamiento de la base de datos.

### Arranque del contexto de Spring en CI sin credenciales externas

Al configurar el pipeline de integración continua se descubrió que los tests de integración (`@SpringBootTest`) fallaban en el entorno de GitHub Actions porque el contexto completo de Spring intenta resolver todos los `@Value` al arrancar, incluyendo las credenciales de la API de correo (Resend) y la clave de la API de Gemini. Estas variables no existen en el entorno de CI por razones de seguridad.

Se resolvió declarando las variables de entorno con valor vacío directamente en el job de CI del workflow, lo que permite al contexto de Spring arrancar sin errores al no encontrar un valor nulo sino una cadena vacía. Los tests que realmente necesitan estas credenciales están aislados o mockeados, por lo que el resultado de los tests no se ve afectado.

---

## 6.3. Decisiones técnicas clave y su justificación

### Arquitectura de microservicios con Docker Compose

Se separó el procesado OCR en un microservicio Python independiente en lugar de integrarlo directamente en el backend Java. Esto aisló la complejidad de PaddleOCR (dependencias nativas de Python, tiempo de arranque largo, consumo de memoria elevado) del backend principal, permitiendo actualizarlo o sustituirlo sin afectar al resto del sistema.

### Tokens CSS para el sistema de temas

En lugar de duplicar las hojas de estilo para cada tema, se definieron custom properties CSS que cambian de valor cuando el atributo `data-theme="dark"` está presente en el elemento raíz. Esto permite cambiar de tema en tiempo de ejecución sin recargar la página y sin añadir clases a cada componente.

### JWT sin estado con lista negra de tokens

El backend usa autenticación JWT sin estado (stateless), lo que simplifica el escalado horizontal. Para cubrir el caso de logout explícito se mantiene en memoria una lista negra de tokens invalidados, balanceando la ausencia de sesión en servidor con la posibilidad de revocar tokens de forma inmediata.

La gestión de sesión en el cliente se reforzó con una doble capa de protección: al arrancar la aplicación, `AuthService.loadUser()` decodifica el claim `exp` del JWT almacenado en `localStorage` y descarta la sesión si el token ya ha expirado, evitando que el usuario acceda al dashboard con credenciales caducas incluso antes de realizar cualquier petición al backend. Para los tokens que expiran durante una sesión activa, el interceptor HTTP captura cualquier respuesta `401` de los endpoints protegidos y ejecuta automáticamente el logout y la redirección a la página de inicio.

### Rate limiting en el filtro de seguridad

Se añadió un filtro de limitación de peticiones antes de llegar a los controladores para proteger los endpoints de autenticación frente a ataques de fuerza bruta, sin depender de librerías externas y con configuración centralizada en las variables de entorno.

### Angular standalone components

Todo el frontend usa componentes standalone de Angular, eliminando la necesidad de NgModules. Esto reduce el boilerplate, facilita el lazy loading por ruta y hace más evidente el árbol de dependencias de cada componente.

### Aislamiento de red en Docker Compose

Todos los servicios se comunican a través de una red interna (`scantral-net`). Al exterior solo se expone el puerto del frontend. El backend, la base de datos y el microservicio OCR son inaccesibles directamente desde el host, reduciendo la superficie de ataque.

---

## 6.4. Control de versiones

El proyecto utiliza **Git** como sistema de control de versiones con repositorio alojado en **GitHub**.

La estrategia de ramas seguida es **trunk-based**: el desarrollo se realizó directamente sobre `main`, con commits atómicos y descriptivos que reflejan cada unidad de trabajo. Cada commit corresponde a la creación, modificación o corrección de un único elemento funcional o técnico.

Se configuró un pipeline de **GitHub Actions** con dos flujos automáticos.

**Flujo CI** (`ci.yml`) — se ejecuta en cada push y en cada pull request sobre `main`. Lanza tres jobs en paralelo, uno por servicio:

- **Backend (Spring Boot)**: levanta un contenedor de PostgreSQL 17 como servicio del propio job, configura JDK 21 con caché de Maven, y ejecuta `./mvnw -B verify`, que compila el proyecto, lanza todos los tests unitarios e de integración y genera el informe de cobertura con JaCoCo. Las variables de entorno sensibles (API key de Resend, clave de Gemini) se declaran vacías en el job para que el contexto de Spring pueda arrancar sin errores en CI.
- **Frontend (Angular)**: configura Node.js 20 con caché de npm, instala dependencias con `npm ci` y ejecuta `npm run build --configuration production` para verificar que la compilación de producción no produce errores de tipado ni de bundling.
- **Microservicio OCR (Python)**: configura Python 3.11 y ejecuta `python -m py_compile app.py` para verificar que el fichero principal no tiene errores de sintaxis, sin necesidad de instalar las dependencias pesadas de PaddleOCR.

**Flujo CD** (`docker-publish.yml`) — se ejecuta en cada push a `main` y en la publicación de tags `v*`. Define una matriz de tres servicios (`scantral-backend`, `scantral-frontend`, `scantral-paddleocr`) y construye y publica cada imagen en Docker Hub de forma independiente y en paralelo, usando `fail-fast: false` para que el fallo de una imagen no cancele las demás. Las imágenes se etiquetan automáticamente con el nombre de la rama, el tag semántico (si existe), el SHA corto del commit y `latest` cuando el origen es `main`. La acción `docker/build-push-action` utiliza caché de GitHub Actions (`type=gha`) para acelerar las construcciones sucesivas.

El fichero `.env.example` documenta todas las variables de entorno necesarias sin exponer valores reales, y el `.gitignore` garantiza que los ficheros de configuración sensibles y los artefactos de compilación no se incluyan en el repositorio.

---

## 6.5. Fragmentos de código relevantes

### AIDocumentExtractor — llamada a Gemini con reintentos y fallback

El extractor de IA codifica la imagen en Base64 y construye una petición multimodal hacia la API REST de Gemini. Si la API key no está configurada, lanza una `ExtractionException` inmediata para que el dispatcher active el fallback OCR sin esperar el timeout de red. Ante errores transitorios (503, 429, 502) implementa un backoff exponencial con hasta cuatro intentos antes de rendirse.

```java
@Override
public ExtractionResult extract(byte[] image, String mimeType) {
    if (apiKey == null || apiKey.isBlank()) {
        throw new ExtractionException("AI extractor disabled: no API key configured");
    }
    String json = callGemini(image, mimeType);
    return parse(json);
}

private String callGemini(byte[] image, String mimeType) {
    String base64 = Base64.getEncoder().encodeToString(image);
    Map<String, Object> textPart  = Map.of("text", AIPromptBuilder.buildSystemPrompt());
    Map<String, Object> imagePart = Map.of(
            "inline_data", Map.of("mime_type", mimeType, "data", base64));
    Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                    "role", "user",
                    "parts", List.of(textPart, imagePart))),
            "generationConfig", Map.of(
                    "temperature", 0,
                    "responseMimeType", "application/json"));

    String url = apiUrl + "/" + model + ":generateContent?key=" + apiKey;
    // Reintentos con backoff exponencial ante errores transitorios
    int maxAttempts = 4;
    long backoffMs  = 800L;
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // ... realiza la petición POST y extrae el texto de la respuesta
        } catch (Exception e) {
            if (attempt == maxAttempts) throw new ExtractionException("Gemini failed after retries", e);
            Thread.sleep(backoffMs * attempt);
        }
    }
}
```

### AIPromptBuilder — prompt estructurado para respuesta JSON

El prompt del sistema obliga al modelo a responder exclusivamente con un JSON que sigue un esquema predefinido. Esta restricción elimina la necesidad de parsear lenguaje natural y garantiza un contrato estable entre el LLM y el parseador Java. El campo `receiptCategory` clasifica los tickets en tres cubos (`garantia`, `devolucion`, `otro`) con reglas de negocio detalladas directamente en el prompt para reducir al mínimo las alucinaciones.

```java
public static String buildSystemPrompt() {
    return """
            Eres un extractor experto de información documental (tickets, facturas,
            garantías y documentos oficiales españoles: DNI, pasaporte, carnet de
            conducir, ITV, seguros).

            Analiza la imagen adjunta y responde EXCLUSIVAMENTE con un JSON válido
            (sin texto adicional, sin ``` markdown) que cumpla este esquema:

            {
              "detectedType": "DNI|PASSPORT|DRIVING_LICENSE|INSURANCE|ITV|RECEIPT|WARRANTY|INVOICE|OTHER",
              "issueDate": "YYYY-MM-DD | null",
              "expiryDate": "YYYY-MM-DD | null",
              "merchant": "string | null",
              "holderName": "string | null",
              "receiptCategory": "devolucion|garantia|otro | null",
              "totalAmount": number_or_null,
              "confidences": { "detectedType": 0.0, "issueDate": 0.0, ... },
              "overallConfidence": 0.0
            }

            Reglas estrictas:
            - Si no puedes leer un campo, devuélvelo como null y su confidence como 0.
            - NUNCA inventes datos.
            - Fechas siempre en formato ISO 8601 (YYYY-MM-DD).
            """;
}
```

### OcrDocumentExtractor — llamada al microservicio PaddleOCR

El extractor OCR envía la imagen al sidecar Python mediante una petición `multipart/form-data` con `RestClient`. Se establece un timeout explícito para que un sidecar bloqueado no deje la petición del usuario colgada indefinidamente. La respuesta del sidecar es JSON con el texto reconocido, el número de líneas y la confianza media; si el texto llega vacío o el sidecar no es accesible, el extractor devuelve `ExtractionStatus.FAILED` de forma controlada en lugar de propagar una excepción al resto de la pipeline.

```java
@Override
public ExtractionResult extract(byte[] image, String mimeType) {
    try {
        String body = callSidecar(image, mimeType);
        if (body == null || body.isBlank()) {
            log.warn("PaddleOCR returned an empty body");
            return ExtractionResult.failed(ExtractionSource.OCR, null);
        }
        JsonNode node = mapper.readTree(body);
        String text = node.path("text").asText("");
        double avgConf = node.path("averageConfidence").asDouble(0.0);
        int lineCount = node.path("lines").isArray() ? node.path("lines").size() : 0;

        if (text.isBlank()) {
            log.warn("PaddleOCR produced no text (lines={}, avgConf={})", lineCount, avgConf);
            return ExtractionResult.failed(ExtractionSource.OCR, text);
        }
        log.info("PaddleOCR extracted {} chars across {} lines (avgConf={})",
                text.length(), lineCount, String.format("%.3f", avgConf));
        return parser.parse(text);
    } catch (ResourceAccessException e) {
        log.error("PaddleOCR sidecar unreachable at {}: {}", serviceUrl, e.getMessage());
        return ExtractionResult.failed(ExtractionSource.OCR, null);
    }
}
```

### OcrTextParser — análisis heurístico del texto reconocido

Cuando OCR devuelve texto plano, el parser aplica expresiones regulares tolerantes a los errores típicos de PaddleOCR (fechas pegadas a la hora, separadores variables, meses en texto). La confianza de todos los campos reconocidos por esta vía se limita a `0.6` para que el frontend siempre marque el resultado como pendiente de revisión manual, diferenciando así el resultado OCR del resultado IA.

```java
private static final double MAX_OCR_CONFIDENCE = 0.6;

// Tolera "07/02/201314:25" (fecha pegada a la hora que genera PaddleOCR)
private static final Pattern DATE = Pattern.compile(
        "\\b(\\d{1,2})[/.\\-](\\d{1,2})[/.\\-]((?:19|20)\\d{2}|\\d{2}(?!\\d))");

// Tolera "07 de junio de 2012", "07/Jun/2012", "07-JUN-2012"
private static final Pattern TEXT_MONTH_DATE = Pattern.compile(
        "(?i)(?<![0-9])(\\d{1,2})[\\s./\\-]{0,4}(?:de\\s+)?"
        + "(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|...)"
        + "[\\s./\\-]{0,4}(?:de\\s+)?(19\\d{2}|20\\d{2})(?![0-9])");
```

### ExtractionDispatcher — selección de extractor con fallback

`ExtractionDispatcher` centraliza la lógica de selección entre OCR e IA. Por defecto usa OCR; si el usuario activa la extracción por IA, Gemini se intenta primero y cualquier excepción provoca un fallback automático a OCR. El resto del sistema no necesita conocer este mecanismo.

```java
public ExtractionResult dispatch(byte[] image, String mime, boolean useAi) {
    if (useAi) {
        ExtractionResult aiResult = tryAi(image, mime);
        if (aiResult != null && aiResult.status() != ExtractionStatus.FAILED) {
            return aiResult;
        }
        log.info("AI extraction unavailable. Falling back to OCR.");
    }
    return ocrExtractor.extract(image, mime);
}

private ExtractionResult tryAi(byte[] image, String mime) {
    try {
        return aiExtractor.extract(image, mime);
    } catch (ExtractionException e) {
        log.warn("AI extractor failed: {}", e.getMessage());
        return null;
    }
}
```

### RulesEngine — motor de reglas abierto a extensión

El motor recibe todas las implementaciones de `Rule` registradas como beans de Spring e itera sobre ellas filtrando primero las que aplican al tipo de documento concreto. Añadir una nueva regla de negocio solo requiere crear un nuevo `@Component` que implemente `Rule`, sin tocar el motor.

```java
public List<RuleOutcome> evaluate(ExtractionResult extraction) {
    if (extraction == null) return List.of();
    RuleContext ctx = new RuleContext(extraction, LocalDate.now());
    return rules.stream()
            .filter(r -> safeApplies(r, ctx))
            .map(r -> safeApply(r, ctx))
            .filter(o -> o != null)
            .toList();
}
```

### OfficialDocumentExpiryRule — ejemplo de regla de negocio

Esta regla se aplica a los documentos oficiales (DNI, pasaporte, carnet de conducir, ITV, seguro) y calcula el estado de vigencia en función de los días que quedan hasta la fecha de caducidad extraída.

```java
@Override
public RuleOutcome apply(RuleContext ctx) {
    LocalDate until = ctx.extraction().expiryDate();
    long days = ChronoUnit.DAYS.between(ctx.today(), until);

    RuleStatus status;
    if (days < 0)        status = RuleStatus.EXPIRED;
    else if (days < 30)  status = RuleStatus.EXPIRING_SOON;
    else                 status = RuleStatus.ACTIVE;

    return new RuleOutcome(code(), "Vigencia del documento", until, days, status,
            "Fecha de vencimiento oficial extraída del documento.");
}
```

### JwtAuthFilter — filtro de autenticación por token

El filtro intercepta cada petición, extrae el token del header `Authorization`, verifica su validez y comprueba que no esté en la lista negra de tokens revocados. Solo entonces popula el `SecurityContextHolder` con el usuario autenticado.

```java
@Override
protected void doFilterInternal(HttpServletRequest request,
        HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")
            && SecurityContextHolder.getContext().getAuthentication() == null) {
        String token = header.substring(7);
        if (jwtService.isValid(token) && !tokenBlacklistService.isRevoked(token)) {
            String email = jwtService.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
    }
    chain.doFilter(request, response);
}
```

### RateLimitFilter — ventana fija por IP

El filtro aplica un límite de peticiones por IP sobre los endpoints de autenticación. Usa `ConcurrentHashMap` con `AtomicInteger` para ser seguro en entornos multihilo sin bloqueos explícitos. El límite y la ventana son configurables por variable de entorno.

```java
@Override
protected void doFilterInternal(HttpServletRequest request,
        HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
    String key = clientIp(request);
    if (!allow(key)) {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"error\":\"Demasiadas peticiones, inténtalo en unos segundos\"}");
        return;
    }
    chain.doFilter(request, response);
}

boolean allow(String key) {
    long now = System.currentTimeMillis();
    Window window = buckets.compute(key, (k, current) -> {
        if (current == null || (now - current.start) >= windowMs) return new Window(now);
        return current;
    });
    return window.count.incrementAndGet() <= maxRequests;
}
```

### AuthInterceptor — inyección automática del token JWT

El interceptor funcional añade el header `Authorization: Bearer <token>` a todas las peticiones salientes hacia la API, saltándose los endpoints de autenticación para evitar un bucle circular.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isApi = req.url.startsWith('/api/');
  const isAuthEndpoint = req.url.startsWith('/api/auth/');

  if (!token || !isApi || isAuthEndpoint) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
```

### ThemeService — tema reactivo con señales de Angular

El servicio usa señales (`signal`) y efectos (`effect`) de Angular para mantener sincronizados el atributo `data-theme` del DOM y el valor persistido en `localStorage`. La resolución del tema inicial respeta la preferencia del sistema operativo si el usuario no ha establecido una preferencia explícita.

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.resolveInitialTheme());
  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this._theme();
      this.document.documentElement.setAttribute('data-theme', theme);
      this.document.defaultView?.localStorage?.setItem('scantral.theme', theme);
    });
  }

  toggle(): void {
    this._theme.update(current => current === 'dark' ? 'light' : 'dark');
  }
}
```

### authRedirectGuard — guard funcional de redirección

Evita que un usuario ya autenticado acceda a rutas públicas como la landing o el login, redirigiendo directamente al dashboard mediante un `UrlTree`.

```typescript
export const authRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isLoggedIn()
    ? router.createUrlTree(['/dashboard'])
    : true;
};
```
