package com.nolocardeno.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test de integración manual: envía un correo real a través de la API de Resend.
 * Solo se ejecuta cuando RESEND_API_KEY está definida en el entorno.
 *
 * Ejecución local:
 *   $env:RESEND_API_KEY="re_..."; $env:MAIL_FROM="alertas@scantral.com"
 *   .\mvnw test "-Dtest=EmailSendManualIT"
 */
@EnabledIfEnvironmentVariable(named = "RESEND_API_KEY", matches = ".+")
class EmailSendManualIT {

    @Test
    void enviarCorreoAlertal_pruebaEmail_manologorrion() {
        String apiKey    = System.getenv("RESEND_API_KEY");
        String mailFrom  = System.getenv().getOrDefault("MAIL_FROM", "alertas@scantral.com");

        RestClient client = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();

        EmailService service = new EmailService(client, mailFrom);

        boolean result = service.sendAlertEmail(
                "manologorrion@hotmail.com",
                "Nolorubio23",
                "Prueba email",
                null,
                "OTHER",
                "Prueba",
                LocalDate.of(2026, 5, 16),
                LocalDate.of(2026, 5, 18),
                1
        );

        assertThat(result)
                .as("El email debería haberse enviado correctamente a través de la API de Resend")
                .isTrue();
    }
}
