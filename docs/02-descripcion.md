# 2. Descripción

## Índice

- [2.1. Descripción detallada de cada funcionalidad principal](#21-descripción-detallada-de-cada-funcionalidad-principal)
  - [Registro y autenticación de usuarios](#registro-y-autenticación-de-usuarios)
  - [Gestión de documentos](#gestión-de-documentos)
  - [Subida de imágenes y análisis automático](#subida-de-imágenes-y-análisis-automático)
  - [Extracción mediante OCR con IA opcional](#extracción-mediante-ocr-con-ia-opcional)
  - [Cálculo automático de plazos y caducidades](#cálculo-automático-de-plazos-y-caducidades)
  - [Sistema de alertas y recordatorios](#sistema-de-alertas-y-recordatorios)
  - [Dashboard y panel de resumen](#dashboard-y-panel-de-resumen)
  - [Búsqueda, filtrado y categorización](#búsqueda-filtrado-y-categorización)
  - [Detección de duplicados](#detección-de-duplicados)
  - [Gestión compartida entre usuarios](#gestión-compartida-entre-usuarios)
  - [Historial de versiones y renovaciones](#historial-de-versiones-y-renovaciones)
  - [Gestión del perfil de usuario](#gestión-del-perfil-de-usuario)
  - [Validador de documentos](#validador-de-documentos)
  - [Exportación al calendario](#exportación-al-calendario)
- [2.2. Interfaz de usuario y experiencia de usuario (UI/UX)](#22-interfaz-de-usuario-y-experiencia-de-usuario-uiux)
  - [Principios de diseño](#principios-de-diseño)
  - [Estructura general de la interfaz](#estructura-general-de-la-interfaz)
  - [Pantallas principales](#pantallas-principales)
  - [Accesibilidad y diseño responsive](#accesibilidad-y-diseño-responsive)
  - [Retroalimentación al usuario](#retroalimentación-al-usuario)
- [2.3. Usuarios objetivo y casos de uso](#23-usuarios-objetivo-y-casos-de-uso)
  - [Perfiles de usuario](#perfiles-de-usuario)
  - [Casos de uso y flujos principales](#casos-de-uso-y-flujos-principales)
  - [Tabla resumen de casos de uso](#tabla-resumen-de-casos-de-uso)

## 2.1. Descripción detallada de cada funcionalidad principal

A continuación se describen, una a una, las funcionalidades que conforman **Scantral**. Algunas pertenecen al núcleo del MVP, mientras que otras se plantean como funcionalidades avanzadas que complementan la propuesta y dan valor diferencial frente a las aplicaciones analizadas.

### Registro y autenticación de usuarios

La aplicación dispone de un sistema de cuentas que permite a cada usuario disponer de su propio espacio privado de documentos. Las funciones incluidas son:

- Registro mediante correo electrónico y contraseña.
- Inicio de sesión con autenticación basada en **JWT (JSON Web Token)**.
- Cierre de sesión seguro con invalidación del token mediante una lista negra (*token blacklist*).
- Hashing de contraseñas mediante **BCrypt**.
- Control de acceso basado en roles (usuario estándar y administrador).
- Protección frente a ataques de fuerza bruta mediante un *rate limiter*.

### Gestión de documentos

Es la funcionalidad central de la aplicación. Cada usuario puede dar de alta, consultar, modificar y eliminar documentos. Para cada documento se almacenan, entre otros, los siguientes datos:

- Tipo de documento (Documento oficial o ticket).
- Categoría (DNI, Pasaporte, Carnet de conducir, otro...)
- Título o descripción.
- Comercio o entidad emisora.
- Fecha de emisión y fecha de caducidad.
- Imagen adjunta (si aplica).

El usuario puede registrar los documentos **de forma manual** o apoyarse en la subida de imágenes para autocompletar los campos. Por defecto, la extracción se realiza mediante OCR (**PaddleOCR**), y opcionalmente el usuario puede activar la extracción mediante IA (**Gemini API**) para obtener resultados más precisos en documentos complejos.

### Subida de imágenes y análisis automático

El usuario puede adjuntar la imagen de un documento físico (foto de un ticket, escaneo de un DNI, etc.) y la aplicación intenta extraer automáticamente la información relevante. El proceso se compone de:

1. Validación del archivo (formato, tamaño y tipo MIME).
2. Almacenamiento seguro de la imagen en el servidor.
3. Envío de la imagen al servicio de análisis.
4. Devolución de los campos detectados al formulario para que el usuario pueda revisarlos antes de guardar.

### Extracción mediante OCR con IA opcional

La aplicación ofrece dos métodos de extracción de información a partir de la imagen del documento, y es el propio usuario quien decide cuál utilizar en cada subida:

- **Análisis principal con OCR (por defecto)**: se utiliza un servicio OCR basado en **PaddleOCR** que extrae el texto del documento y, mediante reglas, identifica los campos clave (fechas, comercio, importe, etc.). Es el método empleado de forma predeterminada, ya que funciona de manera local, sin coste por consulta y sin enviar la imagen a servicios externos.
- **Análisis opcional mediante IA**: si el usuario lo selecciona expresamente al subir la imagen, el documento se procesa con un modelo de inteligencia artificial (**Gemini API**) capaz de interpretar el contenido de forma más precisa y devolver los campos estructurados. Esta opción es especialmente útil para documentos complejos, imágenes de baja calidad o tickets con formatos poco habituales.

Este enfoque permite combinar la **eficiencia y privacidad** del OCR con la **mayor precisión** de la IA, dejando la elección en manos del usuario en función de sus necesidades.

### Cálculo automático de plazos y caducidades

Una vez extraídos los datos, la aplicación calcula automáticamente los plazos relevantes en función del tipo de documento:

- **Garantías de productos**: a partir de la fecha de compra se calcula la fecha de fin de garantía aplicando el plazo legal (por defecto, 3 años en España) o el indicado por el usuario.
- **Documentos oficiales**: se aplican los plazos de validez típicos (DNI, pasaporte, carnet de conducir, ITV).
- **Tickets y facturas**: se calculan plazos de devolución o de conservación fiscal.

El usuario siempre puede ajustar manualmente las fechas calculadas.

### Sistema de alertas y recordatorios

Scantral dispone de un sistema de alertas por correo electrónico que avisa al usuario cuando un documento se aproxima a su fecha de caducidad. El funcionamiento es el siguiente:

**Configuración de alertas**

Desde la pantalla de detalle de cada documento, el usuario puede crear una o varias alertas indicando con cuántos días de antelación quiere ser notificado. La interfaz ofrece tres accesos rápidos predefinidos (1, 7 y 30 días) y permite introducir también un valor personalizado. Es posible tener varias alertas activas para un mismo documento con diferentes umbrales, y eliminarlas individualmente en cualquier momento. El sistema impide crear alertas duplicadas para la misma combinación de documento, usuario y número de días.

**Envío de notificaciones**

Una tarea programada se ejecuta automáticamente cada día a las 08:00. Esta tarea comprueba qué documentos caducan exactamente en el número de días configurado en cada alerta activa y envía un correo electrónico al usuario correspondiente. El correo incluye el nombre del documento, los días que quedan hasta el vencimiento y un código de color según la urgencia: rojo para 7 días o menos, naranja entre 7 y 14, y azul para más de 14 días. Cada alerta se dispara una única vez: una vez enviado el correo, queda marcada con la fecha y hora del envío.

**Requisitos de configuración**

El envío de correos utiliza SMTP (por defecto Gmail) y requiere configurar las variables de entorno `MAIL_USERNAME` y `MAIL_PASSWORD` en el servidor para que las notificaciones funcionen.

### Dashboard y panel de resumen

Al iniciar sesión, el usuario accede al **dashboard**, que es la pantalla principal de la aplicación. Desde aquí puede:

- Consultar todos sus documentos en un listado con tarjetas visuales.
- Ver de un vistazo el estado de cada documento (activo, próximo a caducar, caducado o renovado) mediante código de color.
- Filtrar por tipo y estado: todos, tickets, documentos oficiales o caducados. Cada filtro muestra su contador en tiempo real.
- Buscar por texto sobre el título, la categoría o el comercio.
- Navegar entre páginas (9 documentos por página).
- Abrir el flujo de alta de un nuevo documento.

### Búsqueda, filtrado y categorización

La lista de documentos incluye herramientas para localizar rápidamente la información:

- **Búsqueda por texto** sobre título, categoría o comercio.
- **Filtros** por tipo de documento y estado: todos, tickets, documentos oficiales y caducados.
- **Paginación** del listado (9 documentos por página) para soportar volúmenes grandes de documentos.

### Detección de duplicados

Cuando el usuario sube una imagen o registra un nuevo documento, la aplicación compara la información extraída con la ya existente para detectar posibles duplicados (mismo comercio, mismo importe y fechas próximas). Si se detecta una coincidencia, se avisa al usuario antes de guardar.

### Gestión compartida entre usuarios

Una funcionalidad avanzada que permite organizar a varios usuarios en **grupos** para compartir documentos de forma colectiva (por ejemplo, los documentos del hogar, el vehículo familiar o seguros compartidos).

**Creación y acceso a grupos**

Cualquier usuario puede crear un grupo indicando un nombre y, opcionalmente, una descripción. En el momento de la creación, la aplicación genera automáticamente un **código de acceso de 10 caracteres** (alfanumérico, único por grupo). Este código es el que el creador comparte con las personas que quiera incorporar: cualquier usuario que introduzca ese código en la opción *Unirse a un grupo* pasará a ser miembro.

**Roles dentro del grupo**

Existen dos roles diferenciados:

- **Creador**: el usuario que fundó el grupo. Es el único que puede eliminarlo. No puede abandonarlo; si desea desvincularse debe eliminar el grupo por completo.
- **Miembro**: el resto de usuarios que se unieron mediante el código. Pueden consultar todos los documentos del grupo y, si el creador lo permite, añadir documentos propios al grupo. Pueden abandonar el grupo en cualquier momento.

**Permisos de aportación de documentos**

Al crear el grupo, el creador puede configurar si **todos los miembros pueden añadir documentos** o si esta acción está reservada exclusivamente al propio creador. Esta opción es modificable posteriormente desde los ajustes del grupo.

**Documentos compartidos**

Cuando un usuario añade un documento al grupo, este queda visible para todos los miembros. El documento mantiene como propietario al usuario que lo subió, pero se asocia también al grupo, de modo que aparece tanto en la lista personal del usuario como en la vista de documentos del grupo. Si el documento se elimina, se desvincula automáticamente de todos los grupos en los que estuviera.

**Información visible para los miembros**

Desde la vista de detalle del grupo, los miembros pueden consultar: el nombre y descripción del grupo, el código de acceso (para compartirlo con otros usuarios) y la lista completa de miembros con su nombre e imagen de perfil.

### Historial de versiones y renovaciones

Cada documento dispone de dos registros de historial independientes que se actualizan de forma **automática**, sin que el usuario tenga que hacer nada.

**Historial de cambios (auditoría)**

Cada vez que se produce una modificación sobre un documento, se genera una entrada en el historial de cambios que recoge: el tipo de acción realizada, una descripción legible de qué campos cambiaron y sus valores anteriores y nuevos (por ejemplo, `Fecha de expiración: 01/01/2024 → 31/12/2025`), el usuario que realizó el cambio y la fecha y hora exactas. Los tipos de cambio registrados son: creación del documento (manual o desde imagen), edición de campos, actualización de imagen y renovación de fecha de caducidad.

**Historial de renovaciones de caducidad**

Cuando el usuario actualiza la fecha de caducidad de un documento mediante la acción de renovación, se genera además una entrada específica en el historial de renovaciones que almacena la fecha anterior, la nueva fecha y, opcionalmente, notas sobre esa renovación. Este historial permite consultar todas las renovaciones pasadas de un documento en orden cronológico inverso.

Ambos historiales son de **solo lectura**: reflejan fielmente lo que ha ocurrido con el documento, pero no permiten revertir el estado a una versión anterior. Si el documento se elimina, su historial desaparece con él.

### Gestión del perfil de usuario

Cada usuario dispone de una sección de ajustes desde la que puede gestionar su cuenta de forma autónoma. Las acciones disponibles son:

- **Actualización de datos personales**: el usuario puede cambiar su nombre y su dirección de correo electrónico en cualquier momento.
- **Cambio de contraseña**: modificación de la contraseña actual introduciendo la nueva y confirmándola.
- **Imagen de perfil (avatar)**: subida de una foto de perfil que se mostrará en los grupos compartidos y en la cabecera de la aplicación.
- **Eliminación de cuenta**: el usuario puede eliminar su cuenta de forma permanente. Esta acción borra en cascada todos sus documentos, historial, alertas y membresías de grupo.

### Validador de documentos

Scantral incluye una herramienta auxiliar que permite comprobar si un **documento oficial es válido en una fecha concreta**. El usuario selecciona la fecha sobre la que quiere hacer la comprobación y la herramienta responde indicando si los documentos oficiales asociados a este usuario estarían vigentes o caducados en ese momento.

Esta funcionalidad es útil, por ejemplo, para verificar con antelación si los documentos guardados en la aplicación seguirán siendo válidos en la fecha de un viaje planificado o de un trámite administrativo futuro. Los documentos que no tienen fecha de caducidad registrada se consideran siempre vigentes.

### Exportación al calendario

Desde la pantalla de detalle de cada documento, el usuario puede exportar la fecha de caducidad directamente a su calendario personal. Esta funcionalidad se ejecuta íntegramente en el navegador, sin necesidad de procesamiento en el servidor, y ofrece tres opciones:

- **Google Calendar**: abre Google Calendar en el navegador con el evento ya creado y los datos del documento precargados.
- **Outlook**: abre Outlook Web con el evento precargado de la misma forma.
- **Descarga de archivo ICS**: genera y descarga un archivo estándar RFC 5545 compatible con cualquier aplicación de calendario (Apple Calendar, Thunderbird, etc.).

Esta opción solo está disponible para documentos que tengan fecha de caducidad registrada.

## 2.2. Interfaz de usuario y experiencia de usuario (UI/UX)

La interfaz se ha diseñado priorizando la **claridad**, la **rapidez de uso** y la **accesibilidad**, partiendo de la base de que muchos usuarios potenciales no son perfiles técnicos.

### Principios de diseño

- **Simplicidad**: interfaz limpia, con jerarquía visual clara y poca carga cognitiva.
- **Coherencia**: mismos patrones visuales y de interacción en toda la aplicación.
- **Eficiencia**: las acciones más frecuentes (subir un ticket, ver alertas) están a un solo clic desde el dashboard.
- **Confianza**: mensajes claros sobre el estado de las operaciones, especialmente en el análisis automático.
- **Privacidad**: la información sensible se muestra solo cuando el usuario la solicita.

### Estructura general de la interfaz

La aplicación se organiza como una **Single Page Application (SPA)** con la siguiente estructura común en las páginas autenticadas:

- **Barra lateral (sidebar)** con los accesos de navegación principal: Dashboard, Grupos, Validador, Ajustes y Cierre de sesión. En móvil se convierte en un cajón deslizable con fondo oscuro.
- **Área central de contenido** que cambia según la sección activa.
- **Notificaciones flotantes** (*toasts*) para confirmar acciones o mostrar errores.

### Pantallas principales

| Ruta | Pantalla | Contenido principal |
|---|---|---|
| `/` | Landing | Página pública de presentación con funcionalidades, preguntas frecuentes y acceso al login/registro. |
| `/dashboard` | Dashboard | Listado paginado de todos los documentos del usuario con buscador, filtros por tipo y estado (todos, tickets, documentos, caducados) y botón para añadir un nuevo documento. |
| `/documents/:id` | Detalle de documento | Vista con tres pestañas: (1) datos del documento e imagen, (2) alertas por correo y exportación al calendario, (3) historial de cambios y renovaciones. |
| `/groups` | Grupos | Listado de grupos del usuario con buscador y opciones para crear un grupo nuevo o unirse a uno mediante código de acceso. |
| `/groups/:id` | Detalle de grupo | Documentos del grupo con filtros y búsqueda, panel lateral con el código de acceso, lista de miembros y opciones de eliminar o abandonar el grupo. |
| `/validator` | Validador | Herramienta para comprobar qué documentos oficiales del usuario son válidos o han caducado en una fecha concreta introducida por el usuario. |
| `/settings` | Ajustes | Formulario para actualizar nombre, correo y contraseña; subida de avatar; y eliminación de cuenta. |

### Accesibilidad y diseño responsive

- Diseño **responsive** adaptado a escritorio, tablet y móvil.
- Uso de **contraste suficiente** y tamaños de fuente legibles.
- Navegación por **teclado** y atributos **ARIA** en los componentes interactivos.
- La interfaz persigue la conformidad con las recomendaciones **WCAG 2.1 AA**; su grado de cumplimiento se evidenciará más adelante mediante capturas de análisis realizados con herramientas como **WAVE**.

### Retroalimentación al usuario

- Indicadores de carga durante el análisis de imágenes.
- Mensajes claros de éxito o error tras cada operación.
- Confirmaciones explícitas en acciones destructivas (eliminar, salir).
- Visualización destacada de los documentos próximos a caducar mediante código de color (verde, ámbar, rojo).

## 2.3. Usuarios objetivo y casos de uso

### Perfiles de usuario

Scantral se dirige principalmente a **usuarios particulares** que necesitan organizar su documentación personal de forma sencilla y centralizada. No requiere conocimientos técnicos avanzados: el punto de entrada habitual es simplemente hacer una foto a un papel. A partir del análisis realizado se identifican los siguientes perfiles:

---

**Usuario individual**

Persona adulta, habitualmente de entre 20 y 50 años, que acumula documentación dispersa entre el correo electrónico, carpetas físicas y la galería del móvil. Su principal frustración es no recordar cuándo caduca su DNI, la ITV o una póliza, y tener que buscar entre papeles cuando necesita demostrar la compra de un electrodoméstico. Scantral le permite centralizar toda esa información en un único lugar accesible, recibir avisos con antelación y presentar la imagen del documento cuando lo necesite.

---

**Familia o pareja**

Dos o más personas que comparten vivienda, vehículo o bienes del hogar y necesitan que todos los miembros tengan acceso a la documentación común (seguros del hogar, facturas de electrodomésticos, ITV del coche familiar, pasaportes de los hijos). La función de grupos con código de acceso cubre directamente esta necesidad: un miembro crea el grupo, comparte el código con el resto y, a partir de ese momento, todos ven los mismos documentos. El creador puede restringir quién puede añadir documentación o abrirlo a todos los miembros.

---

**Usuario poco técnico**

Persona mayor o con baja experiencia digital que no está dispuesta a rellenar formularios largos. Para este perfil el flujo de subida desde imagen es clave: hace una foto al papel, la sube, revisa que los datos extraídos sean correctos y guarda con un solo toque. El formulario de alta manual es mínimo (solo el título es obligatorio), y la interfaz evita tecnicismos y exceso de opciones en pantalla.

---

**Usuario *power user***

Persona organizada y acostumbrada a herramientas de productividad que quiere exprimir todas las funciones disponibles. Usa los filtros y la búsqueda para localizar documentos en segundos, activa la extracción con IA para documentos complejos, exporta las fechas de caducidad a Google Calendar o Outlook para tenerlas integradas con el resto de su agenda, y usa el validador para comprobar si su documentación estará en vigor antes de un viaje o trámite administrativo.

---

### Casos de uso y flujos principales

A continuación se describen todos los casos de uso junto con los pasos concretos que el usuario sigue en la interfaz cuando corresponde.

**CU-01. Registro y autenticación**
El usuario accede a la landing, pulsa **"Registrarse"** e introduce su nombre, correo y contraseña. Una vez registrado, puede iniciar sesión con sus credenciales. Al cerrar sesión el token queda invalidado de forma segura.

**CU-02. Registrar un documento de forma manual**
El usuario pulsa **"Añadir documento"** en el dashboard, selecciona **"Manual"**, elige el tipo (ticket o documento oficial) y la categoría, rellena el formulario (el título es el único campo obligatorio) y guarda.

**CU-03. Registrar un documento desde imagen (OCR)**
El usuario pulsa **"Añadir documento"**, selecciona **"Desde imagen"** y sube la foto. El sistema extrae los campos mediante OCR, el usuario revisa el formulario prerellenado y guarda.

**CU-04. Extracción opcional mediante IA**
Durante el flujo de subida desde imagen, el usuario activa el interruptor **"Usar IA"** antes de continuar. En ese caso la extracción se realiza con el modelo de IA en lugar de OCR, obteniendo mayor precisión en documentos complejos o de baja calidad.

**CU-05. Cálculo automático de plazos**
Al guardar un documento, el sistema calcula automáticamente la fecha de caducidad en función del tipo y la categoría (por ejemplo, 3 años de garantía para productos, plazos legales para documentos oficiales). El usuario puede ajustar la fecha calculada antes de confirmar.

**CU-06. Visualización del dashboard**
Al iniciar sesión, el usuario aterriza en el dashboard, donde ve todos sus documentos paginados (9 por página) con su estado visual (activo, próximo a caducar, caducado, renovado) y accede a búsqueda y filtros.

**CU-07. Búsqueda y filtrado de documentos**
Desde el dashboard, el usuario escribe en el buscador o selecciona un filtro (todos, tickets, documentos oficiales, caducados) para acotar la lista. Ambos controles funcionan simultáneamente.

**CU-08. Edición y eliminación de documentos**
Desde el detalle de un documento, el usuario puede pulsar **"Editar"** para modificar cualquier campo o la imagen, o eliminar el documento con confirmación explícita. Cada cambio queda registrado en el historial.

**CU-09. Configurar una alerta de caducidad**
Desde la pestaña **"Alertas y exportación"** del detalle de cualquier documento, el usuario pulsa uno de los accesos rápidos (1, 7 o 30 días) o introduce un valor personalizado. Puede crear varias alertas con distintos umbrales y eliminarlas individualmente.

**CU-10. Recepción de notificación por correo**
A las 08:00 cada día, el sistema comprueba automáticamente qué documentos caducan exactamente en el número de días configurado en cada alerta activa y envía un correo HTML al usuario. La alerta queda marcada como enviada y no se repite.

**CU-11. Exportar una caducidad al calendario personal**
Desde la pestaña **"Alertas y exportación"** del detalle del documento, el usuario pulsa **"Google Calendar"**, **"Outlook"** o **"Descargar ICS"** para añadir el vencimiento a su calendario. La opción solo aparece si el documento tiene fecha de caducidad.

**CU-12. Detección de duplicados**
Al guardar un nuevo documento, el sistema compara su información con los ya existentes. Si detecta una coincidencia probable (mismo comercio, importe y fechas próximas), avisa al usuario antes de confirmar el guardado.

**CU-13. Gestión de grupos y código de acceso**
Un usuario crea un grupo desde la sección **"Grupos"** y comparte el código de acceso generado automáticamente. Los demás miembros se unen introduciendo ese código. Todos pueden consultar los documentos del grupo y, si el creador lo permite, añadir los suyos propios. El creador puede eliminar el grupo; el resto de miembros pueden abandonarlo.

**CU-14. Consulta del historial de versiones y renovaciones**
Desde la pestaña **"Historial"** del detalle de un documento, el usuario consulta la línea de tiempo con todos los cambios realizados (quién, cuándo y qué campo cambió) y el registro de renovaciones de caducidad con las fechas anterior y nueva.

**CU-15. Validar si un documento será válido en una fecha futura**
El usuario accede al **Validador** desde el menú lateral, introduce una fecha futura (por ejemplo, la de un viaje) y obtiene de inmediato qué documentos oficiales estarán vigentes y cuáles habrán caducado en esa fecha.

**CU-16. Gestión del perfil y avatar**
Desde **"Ajustes"**, el usuario puede actualizar su nombre, correo y contraseña, y subir una imagen de perfil que se mostrará en los grupos y en la barra lateral.

**CU-17. Eliminación de cuenta**
Desde **"Ajustes"**, el usuario puede eliminar su cuenta de forma permanente. La acción requiere confirmación explícita y borra en cascada todos sus documentos, historiales, alertas y membresías de grupo.

### Tabla resumen de casos de uso

| Código | Caso de uso | Actor principal | Prioridad |
|:---:|---|---|:---:|
| CU-01 | Registro y autenticación | Usuario | Alta |
| CU-02 | Registro manual de documento | Usuario | Alta |
| CU-03 | Subida de imagen y análisis mediante OCR | Usuario | Alta |
| CU-04 | Extracción opcional mediante IA | Usuario | Alta |
| CU-05 | Cálculo automático de plazos | Sistema | Alta |
| CU-06 | Visualización del dashboard | Usuario | Alta |
| CU-07 | Búsqueda y filtrado de documentos | Usuario | Alta |
| CU-08 | Edición y eliminación de documentos | Usuario | Alta |
| CU-09 | Configuración de alertas de caducidad | Usuario | Alta |
| CU-10 | Recepción de notificación por correo | Sistema | Alta |
| CU-11 | Exportación de caducidad al calendario | Usuario | Media |
| CU-12 | Detección de duplicados | Sistema | Media |
| CU-13 | Gestión de grupos y código de acceso | Usuario | Media |
| CU-14 | Consulta del historial de versiones y renovaciones | Usuario | Media |
| CU-15 | Validación de documento en fecha concreta | Usuario | Media |
| CU-16 | Gestión del perfil y avatar | Usuario | Alta |
| CU-17 | Eliminación de cuenta | Usuario | Media |