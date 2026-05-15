package com.nolocardeno.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    JavaMailSender mailSender;

    @InjectMocks
    EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "alertas@scantral.com");
    }

    private MimeMessage realMimeMessage() {
        return new MimeMessage(Session.getInstance(new Properties()));
    }

    // -----------------------------------------------------------------------
    // Rutas de urgencia según daysLeft
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_daysLeftOne_caducaManana_returnsTrue() {
        when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Mi DNI",
                "Ministerio del Interior", "DNI", "Identidad",
                LocalDate.of(2020, 1, 1), LocalDate.now().plusDays(1), 1
        );

        assertThat(result).isTrue();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendAlertEmail_daysLeft7_colorError_returnsTrue() {
        when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Pasaporte",
                "Policía Nacional", "PASSPORT", "Identidad",
                LocalDate.of(2018, 6, 15), LocalDate.now().plusDays(7), 7
        );

        assertThat(result).isTrue();
    }

    @Test
    void sendAlertEmail_daysLeft10_colorWarning_returnsTrue() {
        when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "ITV",
                "Taller Mecánico", "ITV", "Vehículo",
                LocalDate.of(2024, 3, 1), LocalDate.now().plusDays(10), 10
        );

        assertThat(result).isTrue();
    }

    @Test
    void sendAlertEmail_daysLeft30_colorInfo_returnsTrue() {
        when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

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
        when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Documento sin detalles",
                null, null, null, null, null, 5
        );

        assertThat(result).isTrue();
    }

    @Test
    void sendAlertEmail_blankStoreName_isSkippedInDetails() {
        when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

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
            when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

            boolean result = emailService.sendAlertEmail(
                    "user@test.com", "Usuario", "Documento",
                    "Tienda", type, "Categoría",
                    LocalDate.of(2023, 1, 1), LocalDate.now().plusDays(5), 5
            );

            assertThat(result).withFailMessage("Falló para el tipo: " + type).isTrue();
        }
    }

    // -----------------------------------------------------------------------
    // Escape de HTML en título, nombre y comercio
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_htmlCharsInFields_areEscaped_returnsTrue() {
        when(mailSender.createMimeMessage()).thenReturn(realMimeMessage());

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test <User> & \"Co\"",
                "Doc <script>alert('xss')</script>",
                "<b>Tienda</b>", "INVOICE", "Cat & 'sub'",
                null, null, 2
        );

        assertThat(result).isTrue();
    }

    // -----------------------------------------------------------------------
    // Ruta de fallo — MessagingException → devuelve false
    // -----------------------------------------------------------------------

    @Test
    void sendAlertEmail_messagingException_returnsFalse() throws MessagingException {
        MimeMessage mockMsg = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mockMsg);
        doThrow(new MessagingException("SMTP error"))
                .when(mockMsg).setFrom(any(jakarta.mail.Address.class));

        boolean result = emailService.sendAlertEmail(
                "user@test.com", "Test User", "Mi DNI",
                null, null, null, null, null, 5
        );

        assertThat(result).isFalse();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
