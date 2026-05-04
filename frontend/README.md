# Scantral — Frontend

SPA en **Angular 20** que consume la API de Spring Boot (`backend/`) y se
sirve en producción a través de **Nginx**, que además hace de reverse
proxy de `/api` y `/uploads` hacia el backend.

## Índice

- [Stack](#stack)
- [Estructura](#estructura)
- [Sistema de temas](#sistema-de-temas)
- [Diseño responsive](#diseño-responsive)
- [Desarrollo local (sin Docker)](#desarrollo-local-sin-docker)
- [Build de producción](#build-de-producción)
- [Tests](#tests)
- [Despliegue](#despliegue)

## Stack

| Pieza                | Versión / nota                                         |
| -------------------- | ------------------------------------------------------ |
| Angular              | 20.3 (standalone components, signals, control flow `@if/@for`) |
| Estilos              | SCSS con tokens semánticos para tema claro/oscuro      |
| Iconos               | FontAwesome 6 (`@fortawesome/angular-fontawesope`)     |
| HTTP                 | `HttpClient` con interceptor JWT                       |
| Tests                | Karma + Jasmine                                        |
| Build prod           | `@angular/build` (esbuild)                             |
| Servidor en runtime  | `nginx:alpine` (ver [`Dockerfile`](Dockerfile))        |

## Estructura

```
src/
├── app/
│   ├── components/   Componentes reutilizables (cards, modales, formularios, theme-toggle…)
│   ├── pages/        Una carpeta por ruta principal:
│   │   ├── landing-page/
│   │   ├── dashboard/
│   │   ├── document-detail/
│   │   ├── groups/, group-detail/
│   │   ├── settings/
│   │   └── validator/    (Validador de documentos oficiales)
│   ├── services/     Servicios singleton (auth, document, group, alert, theme, modales…)
│   ├── guards/       authGuard / adminGuard para el router
│   ├── interceptors/ JWT + manejo de 401 / 403 / 429
│   ├── models/       Tipos TS espejo de los DTOs del backend
│   └── utils/        Helpers puros
├── styles/           Sistema de estilos en capas (ITCSS-like):
│   ├── 00-settings/    tokens y variables (incluyendo paleta de tema)
│   ├── 01-tools/       mixins
│   ├── 02-generic/     resets
│   ├── 03-elements/    estilos por defecto de tags
│   └── 04-layout/      grids y wrappers
├── styles.scss       Entry SCSS global
└── index.html, main.ts
```

## Sistema de temas

Hay tokens semánticos (background, surface, text, primary…) definidos
para los modos **claro** y **oscuro** en `src/styles/00-settings/`. El
servicio `theme.service.ts` aplica una clase al `<body>` y persiste la
elección en `localStorage`. El componente `theme-toggle` permite
conmutar manualmente; los componentes ya **no** consumen variables SCSS
crudas, sino los tokens, lo que hace que añadir un nuevo tema sea
únicamente añadir un set de tokens.

## Diseño responsive

Estrategia *desktop-first* con breakpoints entre 320 px y 1280 px.
Probado en móvil (≤ 480), tablet (≤ 768), laptop (≤ 1024) y desktop.

## Desarrollo local (sin Docker)

Requiere Node 20+. Levanta sólo el front contra un backend ya en
ejecución en `http://localhost:8080`:

```bash
cd frontend
npm ci
npm start          # equivale a `ng serve` en :4200
```

El `proxy.conf.json` redirige `/api` y `/uploads` al backend local,
así que en dev **no** hay problemas de CORS.

## Build de producción

```bash
npm run build -- --configuration production
```

Los artefactos quedan en `dist/frontend/browser/`. La imagen Docker los
copia a `/usr/share/nginx/html` y aplica [`nginx.conf`](nginx.conf), que:

1. Sirve los estáticos con fallback SPA: `try_files $uri $uri/ /index.html`.
2. Proxy-pasa `/api/` → `http://backend:8080` (resolución por nombre de
   servicio en la red `scantral-net` del compose).
3. Proxy-pasa `/uploads/` → `http://backend:8080` (avatares e imágenes
   de documentos).
4. Reenvía `Host`, `X-Real-IP`, `X-Forwarded-For` y `X-Forwarded-Proto`
   para que el `RateLimitFilter` del backend pueda contar por IP real.

## Tests

```bash
npm test            # Karma + Jasmine en modo watch
npm test -- --watch=false --browsers=ChromeHeadless   # CI
```

## Despliegue

El front no se despliega por separado: forma parte del `docker-compose.yml`
de la raíz del repo. Ver [`../DEPLOY.md`](../DEPLOY.md).

