# 10. Conclusiones

## Índice

- [10.1. Evaluación crítica respecto a los objetivos iniciales](#101-evaluación-crítica-respecto-a-los-objetivos-iniciales)
- [10.2. Grado de cumplimiento del alcance propuesto](#102-grado-de-cumplimiento-del-alcance-propuesto)
  - [Objetivos funcionales](#objetivos-funcionales)
  - [Objetivos avanzados](#objetivos-avanzados)
  - [Objetivos técnicos](#objetivos-técnicos)
- [10.3. Mejoras futuras propuestas](#103-mejoras-futuras-propuestas)
- [10.4. Lecciones aprendidas](#104-lecciones-aprendidas)

---

## 10.1. Evaluación crítica respecto a los objetivos iniciales

### El punto de partida y la ambición del proyecto

Scantral nació de una observación sencilla pero frecuentemente ignorada: la gestión de documentos personales es un problema cotidiano sin una solución digital satisfactoria. Tickets de compra que se pierden, garantías que expiran sin aviso, documentos oficiales cuya renovación se recuerda cuando ya es tarde. El mercado ofrecía soluciones parciales —archivadores digitales, gestores de recordatorios, escáneres de recibos— pero ninguna integraba de forma coherente la extracción automática de información, el control de vencimientos y la gestión compartida en una única plataforma web accesible desde cualquier dispositivo.

La propuesta inicial de Scantral era, por tanto, ambiciosa en su planteamiento: no limitarse a almacenar documentos, sino entenderlos. El proyecto planteó desde el principio un pipeline de extracción de dos capas —OCR local primero, IA opcional después— como elemento diferenciador respecto a las alternativas del mercado. A esto se sumaron objetivos que van más allá del MVP habitual en proyectos académicos: grupos compartidos, detección de duplicados, historial de renovaciones, exportación a calendarios externos y generación de informes PDF.

Esta ambición era consciente y deliberada. En la propuesta formal se indicó explícitamente que «la idea es incluir absolutamente todas» las funcionalidades, asumiendo que «solo alguna de las extras podría quedarse en el tintero por falta de tiempo o imprevistos». Esta declaración no era retórica: establecía un compromiso claro con el alcance que ahora, al cierre del proyecto, puede evaluarse de forma objetiva.

### Valoración del resultado

Analizando el resultado con perspectiva crítica, la valoración global es positiva pero con matices importantes que merece la pena desarrollar.

El núcleo de la aplicación —registro y autenticación con JWT, gestión completa de documentos con estados dinámicos, pipeline OCR+IA, alertas configurables por correo electrónico y dashboard con filtros— funciona de forma robusta y supera con creces la definición mínima del MVP original. No se trata de un prototipo con funcionalidad simulada: todos estos módulos están implementados, probados con tests unitarios y desplegables mediante un único comando de Docker Compose. Esto es, por sí solo, un resultado significativo para un proyecto de ciclo formativo.

La mayor fortaleza del resultado es su **coherencia arquitectónica**. Angular 20 con componentes standalone y señales reactivas en el frontend, Spring Boot 4 con Java 21 en el backend, PaddleOCR como sidecar Python en el servicio de extracción, y PostgreSQL como capa de persistencia: las cuatro piezas se integran de forma limpia, con una separación clara de responsabilidades entre capas. El hecho de que el sistema tenga una cobertura de pruebas real —no meramente simbólica— significa que el código es mantenible y que cualquier desarrollador externo podría incorporarse al proyecto con una base sólida.

Una fortaleza que merece mención específica es la **privacidad por diseño** aplicada al pipeline de extracción. El OCR se ejecuta en un sidecar local: las imágenes de los documentos del usuario nunca salen del entorno de despliegue en la extracción primaria. La IA de Gemini se ofrece como opción explícitamente activada por el usuario, con plena consciencia de que en ese caso la imagen sí se envía a un servicio externo. Esta decisión de diseño, que diferencia a Scantral de sus competidores directos analizados (ReceiptSafe, SlipCrate, TrackWarranty), no fue accidental: responde a un compromiso con el RGPD y con la confianza del usuario que se planteó desde la propuesta inicial.

### Áreas donde el resultado no alcanzó la aspiración inicial

La evaluación honesta también exige reconocer dónde el resultado se ha quedado por debajo de la ambición original.

La **generación de informes PDF** es el único objetivo avanzado que no se implementó. Es la ausencia más visible, y aunque la decisión fue deliberada —se priorizó la estabilidad del resto de módulos—, sigue siendo una funcionalidad que habría completado el ciclo de valor de la aplicación: el usuario puede gestionar, organizar y exportar recordatorios, pero no puede generar un documento de resumen descargable.

### El proyecto en el contexto de sus competidores

Una de las referencias del análisis inicial era la comparación con ReceiptSafe, SlipCrate y TrackWarranty. En todos los ejes de esa comparación —plataforma web, extracción OCR, extracción IA, gestión de documentos oficiales, detección de duplicados y exportación a calendario— Scantral ofrece funcionalidad que sus competidores no tienen. Esta no es una afirmación retórica: es un hecho verificable confrontando la tabla comparativa del capítulo 1 con el estado actual de la aplicación.

Lo relevante de esta comparación no es la superioridad cuantitativa, sino lo que indica cualitativamente: Scantral ha conseguido en el marco de un proyecto académico lo que aplicaciones comerciales especializadas no ofrecen. Eso no significa que sea mejor en todo —la madurez, la escala, el soporte y la fiabilidad de un producto comercial son dimensiones distintas—, pero sí que la propuesta de valor estaba bien fundamentada desde el principio y que el desarrollo la ha hecho realidad en su mayor parte.

### Conclusión de la evaluación

En conjunto, Scantral es un proyecto que ha cumplido su promesa central: demostrar que es posible construir, con las tecnologías elegidas y en el tiempo disponible, una aplicación web real que resuelva un problema cotidiano de forma más inteligente que las alternativas existentes. La distancia entre la ambición inicial y el resultado final es pequeña y explicable. El proyecto no llega al 100% del alcance propuesto, pero llega con calidad: lo que está hecho, está hecho bien.

---

## 10.2. Grado de cumplimiento del alcance propuesto

### Objetivos funcionales

| Objetivo | Estado | Observaciones |
|---|:---:|---|
| Registro y autenticación segura de usuarios | ✅ Cumplido | JWT + refresh tokens, rate limiting, blacklist de tokens |
| Registro manual de documentos con fechas | ✅ Cumplido | Asistente paso a paso con validación completa |
| Subida de imágenes para análisis automático | ✅ Cumplido | Formatos JPG, JPEG, PNG, WEBP y HEIC/HEIF |
| Extracción de datos mediante OCR (PaddleOCR) | ✅ Cumplido | Sidecar local en Python, sin envío de imágenes a terceros |
| Extracción opcional mediante IA (Gemini) | ✅ Cumplido | Activable por el usuario; fallback automático a OCR |
| Cálculo automático de plazos de caducidad | ✅ Cumplido | Basado en tipo de documento y datos extraídos |
| Sistema de alertas por correo electrónico | ✅ Cumplido | Presets de 1, 7 y 30 días; umbral personalizable |
| Dashboard con resumen de documentos | ✅ Cumplido | Tarjetas con estado visual, filtros y paginación |

Todos los objetivos funcionales definidos en el MVP se han cumplido íntegramente.

### Objetivos avanzados

| Objetivo | Estado | Observaciones |
|---|:---:|---|
| Gestión compartida de documentos (grupos) | ✅ Cumplido | Crear grupo, código de invitación, gestión de miembros |
| Detección de documentos duplicados | ✅ Cumplido | Comparación por hash de imagen en el momento de la subida |
| Historial de renovaciones | ✅ Cumplido | Pestaña «Historial» en el detalle de documento |
| Exportación de recordatorios a calendario | ✅ Cumplido | Google Calendar, Outlook y descarga de fichero `.ics` |
| Generación de informes en PDF | ⚠️ Parcial | La funcionalidad fue descartada en favor de consolidar el resto |

La generación de PDFs fue el único objetivo avanzado que no llegó a implementarse. La decisión fue deliberada: se priorizó la estabilidad y la cobertura de pruebas del resto de módulos sobre añadir una funcionalidad cuyo valor percibido por el usuario era menor que el esfuerzo de implementación.

### Objetivos técnicos

| Objetivo | Estado | Observaciones |
|---|:---:|---|
| SPA con Angular | ✅ Cumplido | Angular 20, componentes standalone, señales reactivas |
| API REST con Spring Boot | ✅ Cumplido | Spring Boot 4, Java 21, endpoints documentados |
| Base de datos PostgreSQL | ✅ Cumplido | JPA/Hibernate, migraciones gestionadas manualmente |
| Empaquetado con Docker y Docker Compose | ✅ Cumplido | Tres servicios: frontend, backend y OCR sidecar |
| Seguridad (HTTPS, hashing, control de acceso) | ✅ Cumplido | BCrypt, JWT, CORS restringido, rate limiting |
| Accesibilidad (WCAG) | ✅ Cumplido | Contraste AA, navegación por teclado, ARIA labels |
| Cobertura de pruebas | ✅ Cumplido | Tests unitarios backend (JUnit + Mockito), frontend (Jasmine/Karma) |

---

## 10.3. Mejoras futuras propuestas

Aunque el estado actual del proyecto es funcional y completo dentro del alcance definido, existen líneas de mejora claras que permitirían evolucionar Scantral hacia un producto real.

**Generación de informes en PDF**  
Es la funcionalidad avanzada que quedó fuera del scope. Su implementación con una librería como iText o Apache PDFBox en el backend no presenta dificultades técnicas relevantes; simplemente requiere tiempo. Permitiría al usuario exportar un resumen de sus documentos o del estado de un grupo compartido.

**Aplicación móvil o PWA**  
Scantral funciona correctamente en navegador móvil, pero no está diseñada como aplicación nativa. Convertirla en una Progressive Web App (PWA) con Angular Service Worker añadiría capacidades offline, instalación en pantalla de inicio y notificaciones push, mejorando significativamente la experiencia en dispositivos móviles.

**Sincronización en la nube del almacenamiento de imágenes**  
Actualmente las imágenes se almacenan en un volumen local de Docker. En un entorno de producción real sería necesario migrar el almacenamiento a un servicio como Amazon S3, Google Cloud Storage o Azure Blob Storage para garantizar disponibilidad, redundancia y escalabilidad.

**Reconocimiento OCR multilingüe y mejora de modelos**  
PaddleOCR soporta múltiples idiomas, pero el sistema actual está configurado para documentos en español. Ampliar el soporte a documentos en inglés, francés o portugués aumentaría significativamente la utilidad de la aplicación para usuarios de otros países.

**Panel de administración**  
En un entorno multi-usuario a escala real sería necesario disponer de un panel de administración para gestionar cuentas, revisar el estado del sistema y moderar contenido. Esta funcionalidad no tiene sentido en el contexto académico actual, pero es un requisito natural de cualquier producto SaaS.

**Modelo freemium**  
La arquitectura actual soporta sin cambios mayores una segmentación por plan de usuario: limitar el número de documentos almacenados, la resolución máxima de imagen o el número de grupos en el plan gratuito, y ofrecer sin restricciones en un plan premium. Esta evolución comercial sería el primer paso hacia la viabilidad económica del producto.

**Notificaciones push en tiempo real**  
El sistema de alertas actual envía correos electrónicos de forma programada. Añadir notificaciones en tiempo real mediante WebSockets o Server-Sent Events permitiría alertar al usuario dentro de la propia aplicación, sin depender del cliente de correo.

---

## 10.4. Lecciones aprendidas

El desarrollo de Scantral ha sido una experiencia intensiva que ha dejado aprendizajes tanto técnicos como de gestión del proyecto. Algunos de ellos confirman principios conocidos; otros han surgido directamente de los errores cometidos durante el proceso.

**La integración de servicios externos consume más tiempo del estimado**  
La experiencia con PaddleOCR y con la API de Gemini lo ha demostrado con claridad. Integrar un servicio externo no es solo llamar a una URL: implica entender sus restricciones, gestionar sus errores, normalizar sus respuestas y construir un mecanismo de fallback robusto. En la propuesta inicial se estimó un sprint para el OCR y otro para la IA; en la práctica, cada uno requirió iteraciones adicionales.

**Definir el MVP con criterio de corte explícito facilita las decisiones difíciles**  
Haber clasificado los objetivos en «funcionales» y «avanzados» desde el inicio resultó fundamental cuando llegó el momento de decidir qué sacrificar. Sin esa jerarquía previa, la decisión de descartar la generación de PDFs habría sido mucho más difícil de justificar. Tener el criterio de corte documentado convierte una renuncia en una decisión racional, no en un fracaso.

**Las pruebas automatizadas no son opcionales en proyectos con refactorizaciones frecuentes**  
Durante el desarrollo hubo varias reestructuraciones del modelo de datos y del pipeline de extracción. En cada una de ellas, la suite de tests unitarios actuó como red de seguridad, detectando regresiones antes de que llegaran a la interfaz. Sin esa cobertura, las refactorizaciones habrían sido mucho más arriesgadas y habrían consumido tiempo de depuración manual.

**El diseño de la interfaz influye directamente en la complejidad del backend**  
Varias decisiones de UX tomadas tarde en el proceso (como el asistente paso a paso para subir documentos o los presets del validador) obligaron a ajustar endpoints y modelos de datos que ya estaban implementados. La lección es que el diseño de la interfaz y el diseño de la API deben evolucionar en paralelo desde el principio, no de forma secuencial.

**Docker simplifica el despliegue pero añade complejidad de desarrollo**  
Trabajar con tres contenedores (frontend, backend y sidecar OCR) ha sido positivo para el despliegue final, pero ha complicado el ciclo de desarrollo: cambios en el sidecar requerían reconstruir imágenes, y la red interna de Docker añadía una capa de indirección que en ocasiones dificultaba la depuración. Haber configurado desde el inicio el modo de desarrollo con `docker-compose.override.yml` y volúmenes montados habría ahorrado tiempo.

**Documentar mientras se desarrolla es exponencialmente más eficiente que documentar al final**  
La documentación técnica de este proyecto se ha ido construyendo de forma paralela al código. Capítulos como el de arquitectura, el de pruebas o el de despliegue se redactaron con el contexto fresco de la implementación. En contraste, los apartados que se dejaron para el final requirieron revisar commits, logs y conversaciones para reconstruir decisiones que en su momento eran evidentes. La documentación continua no es burocracia: es una inversión en tiempo futuro.

**La seguridad no puede añadirse a posteriori**  
Diseñar desde el principio con JWT, rate limiting, lista negra de tokens y validación de entrada ha permitido que la seguridad fuera una propiedad emergente de la arquitectura, no un parche añadido al final. Haber integrado estas medidas desde el primer sprint evitó tener que refactorizar capas enteras de la aplicación en etapas avanzadas del proyecto.
