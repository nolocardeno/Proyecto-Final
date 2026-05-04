# 1. Introducción, objetivos y antecedentes

## Índice

- [1.1. Origen de la idea y motivación del proyecto](#11-origen-de-la-idea-y-motivación-del-proyecto)
- [1.2. Expectativas y objetivos específicos](#12-expectativas-y-objetivos-específicos)
  - [Objetivos funcionales](#objetivos-funcionales)
  - [Objetivos avanzados](#objetivos-avanzados)
  - [Objetivos técnicos](#objetivos-técnicos)
  - [Expectativas del proyecto](#expectativas-del-proyecto)
- [1.3. Análisis comparativo breve de aplicaciones similares](#13-análisis-comparativo-breve-de-aplicaciones-similares)
  - [ReceiptSafe](#receiptsafe)
  - [SlipCrate](#slipcrate)
  - [TrackWarranty](#trackwarranty)
  - [Tabla comparativa](#tabla-comparativa)
  - [Conclusiones del análisis](#conclusiones-del-análisis)

## 1.1. Origen de la idea y motivación del proyecto

La idea de **Scantral** surge a partir de la observación de un problema cotidiano que afecta a una gran cantidad de personas: la dificultad para mantener organizada la documentación personal y los justificantes de compra. En el día a día es habitual perder tickets, olvidar cuándo caduca un documento oficial o descubrir demasiado tarde que la garantía de un producto ya ha expirado. Estas situaciones, aunque pequeñas en apariencia, generan molestias administrativas e incluso pérdidas económicas que en muchos casos podrían evitarse con una mejor gestión.

Muchos de los documentos que utilizamos habitualmente tienen una fecha de caducidad o requieren renovaciones periódicas. Algunos ejemplos son:

- Documento Nacional de Identidad (DNI)
- Pasaporte
- Carnet de conducir
- Pólizas de seguros
- ITV del vehículo

A esto se suman otros elementos cotidianos que también requieren cierto control temporal, como tickets de compra, garantías de productos electrónicos, plazos de devolución o facturas de servicios. En la mayoría de hogares, esta información se gestiona de forma manual y desorganizada: papeles guardados en cajones, fotos sueltas en el móvil o anotaciones dispersas en distintos calendarios.

La motivación principal del proyecto nace de esta carencia. Aunque existen aplicaciones que permiten almacenar documentos o crear recordatorios, la mayoría se limitan a actuar como simples archivadores digitales. No interpretan el contenido de los documentos ni aplican ningún tipo de lógica que ayude al usuario a entender los plazos asociados a cada elemento. Esta limitación, observada de forma reiterada en el entorno cercano, ha sido el punto de partida para plantear una herramienta más completa.

A nivel personal, el proyecto también responde al interés por trabajar con tecnologías actuales como **Angular**, **Spring Boot**, **Docker** y servicios de **inteligencia artificial** y **OCR**, integrándolas en una aplicación real que aborde un problema concreto. De esta forma, el desarrollo de Scantral no solo busca aportar una solución útil a sus posibles usuarios, sino también consolidar conocimientos prácticos en el desarrollo de aplicaciones web modernas con arquitectura cliente-servidor.

## 1.2. Expectativas y objetivos específicos

El objetivo general del proyecto es desarrollar una aplicación web que permita a los usuarios **gestionar de forma centralizada e inteligente sus documentos personales, tickets de compra y garantías**, automatizando en la medida de lo posible la extracción de información y el control de fechas relevantes.

A partir de este objetivo general, se definen los siguientes objetivos específicos:

### Objetivos funcionales

- Permitir el **registro y autenticación** segura de usuarios.
- Ofrecer un **registro manual** de documentos con sus fechas de emisión y caducidad.
- Permitir la **subida de imágenes** de tickets y documentos para su análisis automático.
- Implementar un sistema de **análisis mediante inteligencia artificial** que extraiga la información relevante del documento (fechas, comercio, importe, tipo de producto, etc.).
- Disponer de un sistema de **OCR de respaldo** (Tesseract) para los casos en los que la IA no consiga interpretar correctamente el documento.
- Calcular **automáticamente plazos de garantía o caducidad** en función del tipo de documento y de la información extraída.
- Generar **alertas y recordatorios** para los documentos próximos a expirar.
- Mostrar un **dashboard** con un resumen claro de los documentos registrados y sus vencimientos.

### Objetivos avanzados

- Permitir la **gestión compartida** de documentos entre varios usuarios (familias, parejas, grupos).
- Detectar **documentos o tickets duplicados** comparando información extraída.
- Mantener un **historial de renovaciones** de documentos oficiales.
- Permitir la **exportación de recordatorios** a calendarios externos (Google Calendar, Outlook, Apple Calendar).
- Generar **informes en PDF** con un resumen de los documentos almacenados.

### Objetivos técnicos

- Diseñar la aplicación como una **Single Page Application (SPA)** desarrollada con Angular.
- Construir un **backend basado en Spring Boot** que exponga una API REST.
- Utilizar **PostgreSQL** como sistema de almacenamiento de datos.
- Empaquetar la aplicación mediante **Docker** y **Docker Compose** para facilitar su despliegue.
- Aplicar buenas prácticas de **seguridad** (HTTPS, hashing de contraseñas, control de acceso) y de **protección de datos** acordes al RGPD.
- Cuidar la **accesibilidad** de la interfaz siguiendo las recomendaciones WCAG en la medida de lo posible.

### Expectativas del proyecto

Como expectativa principal, se busca obtener un producto **funcional y demostrable**, capaz de cubrir los casos de uso definidos en el MVP y que sirva como base para una futura evolución hacia un producto real. Aunque el proyecto se desarrolla en un contexto académico, el diseño y la arquitectura están pensados para permitir su crecimiento posterior, tanto en funcionalidades como en número de usuarios.

## 1.3. Análisis comparativo breve de aplicaciones similares

Antes de definir las características de Scantral, se ha realizado un análisis de varias aplicaciones existentes en el mercado que ofrecen funcionalidades relacionadas con el almacenamiento de tickets, la gestión de garantías o el control de documentos. Este estudio ha permitido identificar tanto referentes útiles como limitaciones comunes que la propuesta busca superar.

### ReceiptSafe

Aplicación móvil que permite almacenar tickets escaneados y gestionar las garantías asociadas a cada compra, incluyendo recordatorios antes de su caducidad.

**Limitaciones detectadas:**

- Disponible únicamente como aplicación móvil.
- Las fechas de caducidad deben introducirse manualmente.
- No incorpora interpretación automática del contenido de los tickets.
- Es una aplicación de pago.

### SlipCrate

Aplicación que utiliza inteligencia artificial para escanear tickets y extraer información relevante de manera automática.

**Limitaciones detectadas:**

- Enfocada exclusivamente en la gestión de garantías de productos.
- No permite gestionar documentación oficial (DNI, pasaporte, etc.).
- La versión gratuita es muy limitada.
- No ofrece funcionalidades de gestión compartida entre usuarios.

### TrackWarranty

Sistema basado en IA que analiza recibos y genera alertas antes de que expire la garantía del producto.

**Limitaciones detectadas:**

- Disponible únicamente como aplicación móvil.
- Centrada únicamente en garantías de productos.
- No permite gestionar otros tipos de documentos administrativos.

### Tabla comparativa

| Característica | ReceiptSafe | SlipCrate | TrackWarranty | **Scantral** |
|---|:---:|:---:|:---:|:---:|
| Plataforma web | ❌ | ❌ | ❌ | ✅ |
| Extracción automática con IA | ❌ | ✅ | ✅ | ✅ |
| OCR de respaldo | ❌ | ❌ | ❌ | ✅ |
| Gestión de documentos oficiales | ❌ | ❌ | ❌ | ✅ |
| Gestión de tickets y garantías | ✅ | ✅ | ✅ | ✅ |
| Cálculo automático de plazos | ❌ | Parcial | Parcial | ✅ |
| Detección de duplicados | ❌ | ❌ | ❌ | ✅ |
| Gestión compartida entre usuarios | ❌ | ❌ | ❌ | ✅ |
| Historial de renovaciones | ❌ | ❌ | ❌ | ✅ |
| Exportación a calendarios externos | ❌ | ❌ | ❌ | ✅ |
| Versión gratuita completa | ❌ | Limitada | Limitada | ✅ |

### Conclusiones del análisis

Tras revisar las aplicaciones existentes, se observa que la mayoría comparte una serie de limitaciones comunes:

- Funcionan principalmente como **archivadores digitales** sin interpretar el contenido.
- Están **centradas en un único caso de uso** (normalmente garantías de productos).
- **No permiten gestionar documentación personal oficial**.
- **No ofrecen funcionalidades colaborativas** entre varios usuarios.
- La mayoría son aplicaciones móviles, sin versión web equivalente.

Estas carencias justifican el desarrollo de Scantral como una solución diferenciada, que combina **gestión documental, análisis automático mediante IA, cálculo inteligente de vencimientos y funcionalidades colaborativas** en un único entorno web accesible desde cualquier dispositivo. La propuesta no pretende competir directamente con las aplicaciones existentes, sino cubrir el espacio que estas dejan al ofrecer una herramienta más completa, versátil y orientada al uso personal y familiar de la documentación.
