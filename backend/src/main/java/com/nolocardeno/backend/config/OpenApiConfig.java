package com.nolocardeno.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Documentación OpenAPI 3 generada por springdoc-openapi.
 *
 * <p>Disponible en:
 * <ul>
 *   <li>JSON:  {@code GET /v3/api-docs}</li>
 *   <li>UI:    {@code GET /swagger-ui.html}</li>
 * </ul>
 *
 * <p>Todos los endpoints excepto {@code /api/auth/**} requieren autenticar
 * con un Bearer Token obtenido vía {@code POST /api/auth/login}.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Scantral API",
                version = "1.0.0",
                description = "API REST para la gestión de documentos personales (DNI, pasaportes, " +
                        "tickets, garantías, alertas de caducidad y grupos compartidos).",
                contact = @Contact(name = "Manolo Cárdeno Sánchez"),
                license = @License(name = "MIT")
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Local"),
                @Server(url = "/", description = "Mismo origen")
        },
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {
}
