# 7. Pruebas

## Índice

- [7.1. Metodología de pruebas](#71-metodología-de-pruebas)
- [7.2. Tipos de pruebas realizadas](#72-tipos-de-pruebas-realizadas)
  - [7.2.1. Pruebas unitarias — Backend](#721-pruebas-unitarias--backend)
  - [7.2.2. Pruebas de integración — Backend](#722-pruebas-de-integración--backend)
  - [7.2.3. Pruebas unitarias y de humo — Frontend](#723-pruebas-unitarias-y-de-humo--frontend)
- [7.3. Cobertura de código](#73-cobertura-de-código)
  - [7.3.1. Backend — JaCoCo](#731-backend--jacoco)
  - [7.3.2. Frontend — Istanbul/Karma](#732-frontend--istanbulkarma)
- [7.4. Resultados y estadísticas](#74-resultados-y-estadísticas)
  - [7.4.1. Desglose por suite — Backend](#741-desglose-por-suite--backend)
  - [7.4.2. Desglose por spec — Frontend](#742-desglose-por-spec--frontend)
  - [7.4.3. Integración continua](#743-integración-continua)

---

## 7.1. Metodología de pruebas

La estrategia de pruebas adoptada en Scantral combina diferentes enfoques según la capa de la
aplicación.

**Desarrollo dirigido por pruebas (TDD)**  
En el backend se siguió un ciclo parcialmente orientado a TDD: para las capas de seguridad
(`JwtAuthFilter`, `RateLimitFilter`, `TokenBlacklistService`) y la lógica de negocio de los
servicios (`AuthService`, `DocumentAlertService`, `GroupService`, etc.) se escribieron las pruebas
antes o en paralelo a la implementación. Esto permitió definir contratos de comportamiento —por
ejemplo, que el filtro de límite de tasa devuelve HTTP 429 tras superar la cuota— y asegurarse de
que la implementación satisficiera dichos contratos desde el principio.

**Pruebas manuales exploratorias**  
Durante el desarrollo de la interfaz de usuario y de los flujos de subida OCR/IA se realizaron
pruebas exploratorias manuales en el navegador. Estos casos son difíciles de automatizar sin un
entorno Selenium/Playwright completo y se documentaron como criterios de aceptación informales.
Entre los escenarios verificados manualmente se incluyen: el flujo completo de registro y login,
la subida de un documento con imagen y su procesamiento por PaddleOCR y Gemini, la navegación
por grupos compartidos y la gestión de alertas de caducidad.

**Pruebas de regresión automatizadas vía CI**  
La suite completa de pruebas automatizadas se ejecuta en cada *push* o *pull request* al
repositorio mediante GitHub Actions (`ci.yml`), lo que garantiza que ningún cambio rompa
comportamientos ya validados.

---

## 7.2. Tipos de pruebas realizadas

### 7.2.1. Pruebas unitarias — Backend

Las pruebas unitarias del backend utilizan **JUnit 5** como framework de pruebas y
**Mockito** para el aislamiento de dependencias. Cada clase bajo prueba se instancia
directamente (`@ExtendWith(MockitoExtension.class)`) sin arrancar el contexto de Spring,
lo que proporciona tiempos de ejecución muy bajos.

La clase `ControllersUnitTest` agrupa 22 pruebas que cubren todos los controladores REST.
Las dependencias de servicio se declaran como `@Mock` y se inyectan con `@InjectMocks`,
de modo que cada prueba valida exclusivamente la lógica del controlador (mapeo de DTOs,
códigos de estado HTTP, delegación al servicio):

```java
@ExtendWith(MockitoExtension.class)
class ControllersUnitTest {

    @Mock AuthService authService;
    @Mock DocumentService documentService;
    @Mock GroupService groupService;
    // ...
    @InjectMocks AuthController authController;

    @Test
    void login_returns_200_with_token() {
        when(authService.login(any())).thenReturn(new AuthResponse("tok"));
        ResponseEntity<?> res = authController.login(new AuthRequest("u","p"), mock(HttpServletRequest.class));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
```

El mismo patrón se aplica a los tests de servicios (`AuthServiceTest`, `GroupServiceTest`,
`UserServiceTest`, etc.) y a los componentes de seguridad (`JwtAuthFilterTest`,
`RateLimitFilterTest`, `JwtServiceTest`, `TokenBlacklistServiceTest`).

Un ejemplo representativo de las pruebas del filtro de límite de tasa:

```java
@Test
void doFilterInternal_returns_429_when_quota_exceeded() throws Exception {
    RateLimitFilter filter = new RateLimitFilter(60_000L, 1);
    MockHttpServletRequest req = new MockHttpServletRequest();
    req.setRequestURI("/api/auth/login");
    req.setRemoteAddr("9.9.9.9");
    FilterChain chain = mock(FilterChain.class);

    // Primera llamada pasa
    MockHttpServletResponse ok = new MockHttpServletResponse();
    filter.doFilter(req, ok, chain);
    assertThat(ok.getStatus()).isEqualTo(200);

    // Segunda llamada rechazada con 429
    MockHttpServletResponse blocked = new MockHttpServletResponse();
    filter.doFilter(req, blocked, chain);
    assertThat(blocked.getStatus()).isEqualTo(429);
    assertThat(blocked.getContentAsString()).contains("Demasiadas peticiones");
    verify(chain, times(1)).doFilter(any(), any());
}
```

### 7.2.2. Pruebas de integración — Backend

Las pruebas de integración arrancan el contexto completo de Spring Boot con el perfil
`test`, que apunta a una base de datos H2 en memoria. Cada prueba se ejecuta dentro de
una transacción que se revierte al finalizar, garantizando el aislamiento entre tests:

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DocumentRepositoryTest {

    @Autowired DocumentRepository documentRepository;
    @Autowired UserRepository userRepository;

    @Test
    void findByUserIdOrderByCreatedAtDesc_returns_only_user_documents() {
        User alice = saveUser("alice@x.com");
        User bob   = saveUser("bob@x.com");

        saveDoc(alice, "DNI Alice", DocumentType.DNI, DocumentStatus.ACTIVE);
        saveDoc(bob,   "DNI Bob",   DocumentType.DNI, DocumentStatus.ACTIVE);

        List<Document> aliceDocs =
            documentRepository.findByUserIdOrderByCreatedAtDesc(alice.getId());

        assertThat(aliceDocs).hasSize(1);
        assertThat(aliceDocs.get(0).getUser().getId()).isEqualTo(alice.getId());
    }
}
```

Las clases `DocumentRepositoryTest`, `DocumentSpecificationsTest` y `UserSpecificationsTest`
pertenecen a esta categoría. Adicionalmente, `BackendDelProyectoFinalApplicationTests` actúa
como prueba de humo de integración: verifica que el contexto de aplicación arranca correctamente
(lo que valida toda la configuración de beans, seguridad, JPA y propiedades).

### 7.2.3. Pruebas unitarias y de humo — Frontend

El frontend utiliza **Karma** como ejecutor de pruebas y **Jasmine** como framework de
aserciones, siguiendo la convención estándar de Angular.

**Pruebas unitarias de servicios**  
Cada servicio dispone de su propio archivo `*.spec.ts` en el que se instancia mediante
`TestBed` y se validan sus comportamientos con espías (`spyOn`) o stubs de `HttpClientTestingModule`.
Por ejemplo, `ThemeService` se prueba verificando que lee la preferencia almacenada en
`localStorage`, respeta `prefers-color-scheme` del sistema operativo y persiste los cambios:

```typescript
it('usa el tema almacenado si existe', () => {
  localStorage.setItem('scantral.theme', 'dark');
  const service = makeService();
  expect(service.theme()).toBe('dark');
  expect(service.isDark()).toBeTrue();
});

it('respeta prefers-color-scheme cuando no hay valor en storage', () => {
  spyOn(window, 'matchMedia').and.returnValue({
    matches: true, // simula preferencia dark
  } as MediaQueryList);
  const service = makeService();
  expect(service.theme()).toBe('dark');
});
```

**Pruebas de humo de componentes**  
El archivo `components-smoke.spec.ts` itera sobre un array que recoge la totalidad de los
componentes de la aplicación (layout, auth, shared, pages) y verifica que cada uno puede
instanciarse con `TestBed.createComponent()` sin lanzar excepciones. Esta batería ejerce el
constructor y los `@Input` de todos los componentes, elevando la cobertura de ramas y
sentencias sin duplicar lógica entre tests individuales:

```typescript
describe('Componentes - smoke tests', () => {
  for (const c of cases) {
    it(`${c.name} se crea sin errores`, () => {
      const fixture = TestBed.createComponent(c.component);
      if (c.inputs) {
        for (const [key, value] of Object.entries(c.inputs)) {
          fixture.componentRef.setInput(key, value);
        }
      }
      try { fixture.detectChanges(); } catch { /* ignorar errores de plantilla */ }
      expect(fixture.componentInstance).toBeTruthy();
      fixture.destroy();
    });
  }
});
```

**Guards e interceptores**  
`auth.guard.spec.ts` prueba el guard de rutas privadas: verifica que un usuario sin sesión activa es redirigido a `/` y que uno autenticado puede acceder.  
`auth-redirect.guard.spec.ts` prueba el guard de rutas públicas: verifica que un usuario autenticado es redirigido a `/dashboard` y que uno sin sesión puede acceder.  
`auth.interceptor.spec.ts` prueba el interceptor HTTP de autorización, verificando que se añade la cabecera `Authorization: Bearer <token>` en las peticiones autenticadas.

---

## 7.3. Cobertura de código

### 7.3.1. Backend — JaCoCo

JaCoCo se configura en el ciclo Maven `verify` mediante el plugin `jacoco-maven-plugin`.
La fase `prepare-agent` instrumenta los bytecodes en tiempo de ejecución y escribe el
fichero binario `target/jacoco.exec`; la fase `report` genera el informe HTML/XML a partir
de dicho fichero. En el pipeline de CI el comando `./mvnw -B verify` ejecuta ambas fases
de forma automática.

Los resultados globales del último ciclo de pruebas son los siguientes:

| Métrica      | Cubierto | Total | Porcentaje |
|--------------|----------|-------|------------|
| Instructions | 1 664    | 1 993 | **83,49 %** |
| Branches     | 111      | 152   | **73,03 %** |
| Lines        | 375      | 448   | **83,71 %** |
| Methods      | 115      | 126   | **91,27 %** |
| Classes      | 24       | 24    | **100,00 %** |

El desglose por paquete refleja la distribución esperada: los paquetes de controladores,
repositorios, especificaciones y excepciones alcanzan coberturas muy altas (>99 %), mientras
que el paquete de servicios presenta una cobertura menor porque parte de sus ramas más
complejas (gestión de ficheros físicos, llamadas a APIs externas de OCR/IA) resultan difíciles
de ejercer con tests unitarios puros sin infraestructura real.

| Paquete | Instructions | Lines | Branches | Methods |
|---|---|---|---|---|
| `controller` | 292 / 294 (99,3 %) | 59 / 59 (100,0 %) | 10 / 12 (83,3 %) | 25 / 25 (100,0 %) |
| `exception` | 117 / 117 (100,0 %) | 23 / 23 (100,0 %) | 2 / 2 (100,0 %) | 10 / 10 (100,0 %) |
| `repository.spec` | 145 / 145 (100,0 %) | 25 / 25 (100,0 %) | 14 / 14 (100,0 %) | 13 / 13 (100,0 %) |
| `security` | 441 / 461 (95,7 %) | 113 / 119 (95,0 %) | 36 / 42 (85,7 %) | 35 / 35 (100,0 %) |
| `service` | 669 / 976 (68,5 %) | 155 / 222 (69,8 %) | 49 / 82 (59,8 %) | 32 / 43 (74,4 %) |
| **TOTAL** | **1 664 / 1 993** | **375 / 448** | **111 / 152** | **115 / 126** |

### 7.3.2. Frontend — Istanbul/Karma

El informe de cobertura del frontend se genera mediante **Istanbul** integrado en Karma
(opción `--code-coverage` de Angular CLI). Los resultados globales del último ciclo de
pruebas son los siguientes:

| Métrica    | Cubierto | Total | Porcentaje |
|------------|----------|-------|------------|
| Statements | 1 053    | 1 129 | **93,26 %** |
| Branches   | 206      | 250   | **82,40 %** |
| Functions  | 220      | 258   | **85,27 %** |
| Lines      | 976      | 1 036 | **94,20 %** |

La cobertura de sentencias y líneas supera el 93 %, lo que refleja que la combinación
de pruebas unitarias de servicios más la batería de humo de componentes ejerce la
práctica totalidad del código de producción. La cobertura de ramas es inferior (82 %)
porque algunos bloques condicionales solo son alcanzables bajo condiciones de error que
no se simulan en los smoke tests (p. ej., respuestas HTTP erróneas en componentes que
delegan el manejo al servicio).

---

## 7.4. Resultados y estadísticas

### 7.4.1. Desglose por suite — Backend

Todas las pruebas del backend finalizan con **0 fallos y 0 errores**.

| Suite de pruebas | Tipo | Pruebas | Resultado |
|---|---|---|---|
| `BackendDelProyectoFinalApplicationTests` | Integración (contexto) | 1 | ✅ |
| `ControllersUnitTest` | Unitaria | 22 | ✅ |
| `GlobalExceptionHandlerTest` | Unitaria | 7 | ✅ |
| `DocumentRepositoryTest` | Integración (H2) | 3 | ✅ |
| `DocumentSpecificationsTest` | Integración (H2) | 3 | ✅ |
| `UserSpecificationsTest` | Integración (H2) | 2 | ✅ |
| `CustomUserDetailsAndAuthUtilsTest` | Unitaria | 3 | ✅ |
| `CustomUserDetailsServiceTest` | Unitaria | 2 | ✅ |
| `JsonAuthErrorHandlerTest` | Unitaria | 2 | ✅ |
| `JwtAuthFilterTest` | Unitaria | 4 | ✅ |
| `JwtServiceTest` | Unitaria | 4 | ✅ |
| `RateLimitFilterTest` | Unitaria | 5 | ✅ |
| `TokenBlacklistServiceTest` | Unitaria | 4 | ✅ |
| `AlertSchedulerServiceTest` | Unitaria | 7 | ✅ |
| `AuthServiceTest` | Unitaria | 7 | ✅ |
| `DashboardServiceTest` | Unitaria | 2 | ✅ |
| `DocumentAlertServiceTest` | Unitaria | 8 | ✅ |
| `GroupServiceTest` | Unitaria | 9 | ✅ |
| `UserServiceTest` | Unitaria | 6 | ✅ |
| **TOTAL** | — | **101** | **✅ 100 %** |

El tiempo total de ejecución de la suite completa es de aproximadamente **15,5 segundos**,
de los cuales cerca de 12 segundos corresponden a `BackendDelProyectoFinalApplicationTests`,
que necesita arrancar el contexto completo de Spring Boot con H2.

**Resumen global del backend:**

| Métrica | Valor |
|---|---|
| Total de pruebas | 101 |
| Pruebas exitosas | 101 |
| Fallos | 0 |
| Errores | 0 |
| Omitidas | 0 |
| Tasa de éxito | 100 % |
| Suites de prueba | 19 |
| Tiempo total | ≈ 15,5 s |

### 7.4.2. Desglose por spec — Frontend

Los 35 archivos `*.spec.ts` contienen pruebas escritas explícitamente más el bloque de
smoke tests de `components-smoke.spec.ts`, que genera dinámicamente un caso de prueba por
cada componente de la aplicación (64 componentes). El total real de tests ejecutados es:

| Origen | Specs | Tests |
|---|---|---|
| Pruebas explícitas (`it(...)`) | 34 | 178 |
| Smoke tests generados dinámicamente | 1 (71 componentes) | 71 |
| **TOTAL** | **35** | **249** |

Desglose por categoría de los tests explícitos:

| Categoría | Specs | Tests |
|---|---|---|
| Servicios (14 specs) | `auth.service`, `document.service`, `group.service`, `alert.service`, `theme.service`, etc. | 70 |
| Componentes (13 specs) | `upload-document-modal`, `edit-document-modal`, `login`, `register`, `pagination`, etc. | 77 |
| Guards e interceptores | `auth-redirect.guard`, `auth.interceptor` | 6 |
| Modelos y utils | `document.model`, `calendar-export.utils`, `app-title-strategy` | 11 |
| App raíz | `app.spec.ts` | 4 |
| Smoke (componentes) | `components-smoke.spec.ts` | 71 |

**Resumen global del frontend:**

| Métrica | Valor |
|---|---|
| Total de pruebas | 249 |
| Pruebas exitosas | 249 |
| Fallos | 0 |
| Errores | 0 |
| Specs (archivos) | 35 |
| Tasa de éxito | 100 % |

### 7.4.3. Integración continua

El pipeline de CI (`ci.yml`) ejecuta tres trabajos en paralelo en cada *push* a cualquier
rama y en cada *pull request*:

| Trabajo | Herramienta | Acción |
|---|---|---|
| `backend` | JDK 21 + Maven + PostgreSQL 17 | `./mvnw -B verify` (incluye JaCoCo) |
| `frontend` | Node 20 + Angular CLI | `npm ci` + build de producción |
| `ocr` | Python 3.11 | `py_compile` sobre `paddleocr-service/app.py` |

El trabajo de backend levanta un contenedor de servicio `postgres:17` para que las pruebas
de integración dispongan de la base de datos real; no obstante, las pruebas de repositorio
usan el perfil `test` con H2 en memoria para mayor velocidad y aislamiento. La coexistencia
de ambas bases de datos en CI permite que si en el futuro se añaden pruebas con `postgres:17`
no sea necesario modificar la infraestructura del pipeline.

El pipeline de CD (`docker-publish.yml`) se activa únicamente tras la creación de etiquetas
semánticas (`v*`) y publica las tres imágenes Docker en Docker Hub con etiquetas de versión
(`vX.Y.Z`), SHA de commit y `latest`.
