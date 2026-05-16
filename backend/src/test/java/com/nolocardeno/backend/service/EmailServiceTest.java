package com.nolocardeno.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class EmailServiceTest {

    private static final String RESEND_BASE_URL = "https://api.resend.com";

    private MockRestServiceServer server;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(RESEND_BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        emailService = new EmailService(builder.build(), "alertas@scantral.com");
    }

    private void expectSuccess() {
        server.expect(requestTo(RESEND_BASE_URL + "/emails"))
              .andExpect(method(HttpMethod.POST))
              .andRespond(withSuccess());
    }

    // -----------------------------------------------------------------------
    // Rutas de urgencia según daysLeft
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_daysLeftOne_caducaManana_returnsTrue() {
        expectSuccess();

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Mi DNI",
                "Ministerio del Interior", "DNI", "Identidad",
                LocalDate.of(2020, 1, 1), LocalDate.now().plusDays(1), 1
        );

        assertThat(result).isTrue();
        server.verify();
    }

    @Test
    void sendAlertEmail_daysLeft7_colorError_returnsTrue() {
        expectSuccess();

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Pasaporte",
                "Policía Nacional", "PASSPORT", "Identidad",
                LocalDate.of(2018, 6, 15), LocalDate.now().plusDays(7), 7
        );

        assertThat(result).isTrue();
    }

    @Test
    void sendAlertEmail_daysLeft10_colorWarning_returnsTrue() {
        expectSuccess();

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "ITV",
                "Taller Mecánico", "ITV", "Vehículo",
                LocalDate.of(2024, 3, 1), LocalDate.now().plusDays(10), 10
        );

        assertThat(result).isTrue();
    }

    @Test
    void sendAlertEmail_daysLeft30_colorInfo_returnsTrue() {
        expectSuccess();

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Seguro del coche",
                "Mutua Madrileña", "INSURANCE", "Vehículo",
                LocalDate.of(2024, 1, 1), LocalDate.now().plusDays(30), 30
        );

        assertThat(result).isTrue();
    }

    // -----------------------------------------------------------------------
    // Campos opcionales nulos / en blanco
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_allOptionalFieldsNull_returnsTrue() {
        expectSuccess();

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Documento sin detalles",
                null, null, null, null, null, 5
        );

        assertThat(result).isTrue();
    }

    @Test
    void sendAlertEmail_blankStoreName_isSkippedInDetails() {
        expectSuccess();

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Recibo",
                "  ", "RECEIPT", null, null, LocalDate.now().plusDays(3), 3
        );

        assertThat(result).isTrue();
    }

    // -----------------------------------------------------------------------
    // Tipos de documento — cubre todos los casos del switch formatDocumentType
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_allDocumentTypes_returnsTrueForEach() {
        String[] types = {
                "DNI", "PASSPORT", "DRIVING_LICENSE",
                "INSURANCE", "ITV", "RECEIPT",
                "WARRANTY", "INVOICE",
                "CUSTOM_UNKNOWN_TYPE"   // rama default del switch
        };

        for (String type : types) {
            server.reset();
            expectSuccess();

            boolean result = emailService.sendAlertEmail(
                    "user@test.com", "Usuario", "Documento",
                    "Tienda", type, "Categoría",
                    LocalDate.of(2023, 1, 1), LocalDate.now().plusDays(5), 5
            );

            assertThat(result).withFailMessage("Falló para el tipo: " + type).isTrue();
            server.verify();
        }
    }

    // -----------------------------------------------------------------------
    // Escape de HTML en título, nombre y comercio
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_htmlCharsInFields_areEscaped_returnsTrue() {
        expectSuccess();

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test <User> & \"Co\"",
                "Doc <script>alert('xss')</script>",
                "<b>Tienda</b>", "INVOICE", "Cat & 'sub'",
                null, null, 2
        );

        assertThat(result).isTrue();
    }

    // -----------------------------------------------------------------------
    // Ruta de fallo — error del servidor → devuelve false
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_serverError_returnsFalse() {
        server.expect(requestTo(RESEND_BASE_URL + "/emails"))
              .andRespond(withServerError());

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Mi DNI",
                null, null, null, null, null, 5
        );

        assertThat(result).isFalse();
    }
}

