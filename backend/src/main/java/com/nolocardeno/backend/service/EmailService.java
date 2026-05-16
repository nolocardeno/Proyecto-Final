package com.nolocardeno.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    // --- Paleta de colores del template ---
    private static final String COLOR_PRIMARY      = "#ff9a3c";   // $color-primary
    private static final String COLOR_HEADER_TEXT  = "#171717";   // $neutral-900 (texto sobre gradiente naranja)
    private static final String COLOR_BODY_BG      = "#f7fafc";   // fondo exterior y footer
    private static final String COLOR_BODY_TEXT    = "#4a5568";   // texto principal del cuerpo
    private static final String COLOR_LABEL_TEXT   = "#718096";   // texto de etiquetas en la tarjeta
    private static final String COLOR_FOOTER_TEXT  = "#a0aec0";   // texto del footer

    private static final String COLOR_ERROR   = "#e53e3e";
    private static final String COLOR_WARNING = "#dd6b20";
    private static final String COLOR_INFO    = "#2b6cb0";

    private static final String FONT_PRIMARY = "Arial, sans-serif";

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final RestClient resendClient;
    private final String fromAddress;
    private final String logoDataUri;

    public EmailService(RestClient resendRestClient,
                        @Value("${scantral.mail.from}") String fromAddress) {
        this.resendClient = resendRestClient;
        this.fromAddress  = fromAddress;
        this.logoDataUri  = loadLogoAsDataUri();
    }

    private String loadLogoAsDataUri() {
        try {
            ClassPathResource logo = new ClassPathResource("static/logo.png");
            if (logo.exists()) {
                byte[] bytes = logo.getInputStream().readAllBytes();
                return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
            }
        } catch (IOException e) {
            log.warn("No se pudo cargar el logo para los correos: {}", e.getMessage());
        }
        return "";
    }

    /**
     * Envía el correo de alerta de forma síncrona mediante la API HTTP de Resend.
     * Devuelve {@code true} si el correo se envió con éxito, {@code false} en caso de error.
     * El llamador debe comprobar el valor de retorno antes de marcar la alerta como notificada.
     */
    public boolean sendAlertEmail(String toEmail, String userName, String documentTitle,
                                  String storeName, String type, String category,
                                  LocalDate issueDate, LocalDate expiryDate, int daysLeft) {
        try {
            String subject = "Recordatorio: \"" + documentTitle + "\" caduca en "
                    + daysLeft + (daysLeft == 1 ? " día" : " días");

            final String urgencyColor;
            final String urgencyText;
            if (daysLeft <= 1) {
                urgencyColor = COLOR_ERROR;
                urgencyText  = "¡Caduca mañana!";
            } else if (daysLeft <= 7) {
                urgencyColor = COLOR_ERROR;
                urgencyText  = "Caduca en " + daysLeft + " días";
            } else if (daysLeft <= 14) {
                urgencyColor = COLOR_WARNING;
                urgencyText  = "Caduca en " + daysLeft + " días";
            } else {
                urgencyColor = COLOR_INFO;
                urgencyText  = "Caduca en " + daysLeft + " días";
            }

            String detailRows = buildDetailRows(storeName, type, category, issueDate, expiryDate);
            String html = buildEmailBody(escapeHtml(userName), escapeHtml(documentTitle),
                    urgencyColor, urgencyText, detailRows);

            Map<String, Object> body = Map.of(
                    "from",    fromAddress,
                    "to",      List.of(toEmail),
                    "subject", subject,
                    "html",    html
            );

            resendClient.post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Alerta enviada a {} para el documento \"{}\" ({} días restantes)", toEmail, documentTitle, daysLeft);
            return true;
        } catch (RestClientException e) {
            log.error("Error al enviar alerta a {} para el documento \"{}\": {} - {}",
                    toEmail, documentTitle, e.getClass().getSimpleName(), e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error inesperado al enviar alerta a {} para el documento \"{}\": {} - {}",
                    toEmail, documentTitle, e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String buildDetailRows(String storeName, String type, String category,
                                   LocalDate issueDate, LocalDate expiryDate) {
        StringBuilder sb = new StringBuilder();
        if (storeName != null && !storeName.isBlank()) {
            sb.append(detailRow("Comercio&nbsp;/&nbsp;Entidad", escapeHtml(storeName)));
        }
        if (type != null && !type.isBlank()) {
            sb.append(detailRow("Tipo", formatDocumentType(type)));
        }
        if (category != null && !category.isBlank()) {
            sb.append(detailRow("Categoría", escapeHtml(category)));
        }
        if (issueDate != null) {
            sb.append(detailRow("Fecha de emisión", issueDate.format(DATE_FORMATTER)));
        }
        if (expiryDate != null) {
            sb.append(detailRow("Fecha de caducidad", expiryDate.format(DATE_FORMATTER)));
        }
        return sb.toString();
    }

    private String detailRow(String label, String value) {
        return "<tr>" +
            "<td style=\"padding:4px 0;color:" + COLOR_LABEL_TEXT + ";font-size:13px;width:42%;vertical-align:top;\">" + label + "</td>" +
            "<td style=\"padding:4px 0;color:" + COLOR_BODY_TEXT + ";font-size:13px;font-weight:600;\">" + value + "</td>" +
            "</tr>";
    }

    private String formatDocumentType(String type) {
        if (type == null) return "Documento";
        return switch (type) {
            case "RECEIPT", "WARRANTY", "INVOICE" -> "Ticket";
            default                               -> "Documento";
        };
    }

    private String buildEmailBody(String userName, String documentTitle,
                                  String urgencyColor, String urgencyText,
                                  String detailRows) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family:%s;background-color:%s;margin:0;padding:0;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                     style="background-color:%s;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="560" cellpadding="0" cellspacing="0"
                           style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                      <!-- Cabecera naranja -->
                      <tr>
                        <td style="background-color:%s;padding:20px 32px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;padding-right:12px;">
                                %s
                              </td>
                              <td style="vertical-align:middle;">
                                <h1 style="color:%s;margin:0;font-size:22px;font-weight:700;">Scantral</h1>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Cuerpo -->
                      <tr>
                        <td style="padding:32px;">
                          <p style="color:%s;margin:0 0 16px;">Hola, <strong>%s</strong>.</p>
                          <p style="color:%s;margin:0 0 24px;">Tu documento necesita atención:</p>

                          <!-- Tarjeta del documento -->
                          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                                 style="border:2px solid %s;border-radius:6px;margin-bottom:24px;">
                            <tr>
                              <td style="padding:16px 20px 12px;border-bottom:1px solid #e2e8f0;">
                                <p style="margin:0 0 10px;font-size:18px;font-weight:700;color:%s;">%s</p>
                                <span style="display:inline-block;padding:4px 12px;border-radius:12px;background-color:%s;color:#ffffff;font-size:13px;font-weight:600;">%s</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:14px 20px 16px;">
                                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                                  %s
                                </table>
                              </td>
                            </tr>
                          </table>

                          <p style="color:%s;font-size:13px;margin:0;">
                            Este aviso se generó automáticamente según las alertas que configuraste en Scantral.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color:%s;padding:16px 32px;text-align:center;">
                          <p style="color:%s;font-size:12px;margin:0;">© 2026 Scantral · Gestión de documentos</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(
                FONT_PRIMARY, COLOR_BODY_BG,         // body
                COLOR_BODY_BG,                       // outer table bg
                COLOR_PRIMARY,                       // cabecera bg
                logoDataUri.isBlank() ? "" : "<img src=\"" + logoDataUri + "\" height=\"36\" style=\"display:block;\" alt=\"\">",  // logo
                COLOR_HEADER_TEXT,                   // texto h1 cabecera
                COLOR_BODY_TEXT, userName,           // saludo
                COLOR_BODY_TEXT,                     // subtítulo
                urgencyColor,                        // borde tarjeta
                COLOR_BODY_TEXT, documentTitle,      // título doc
                urgencyColor, urgencyText,           // badge urgencia
                detailRows,                          // filas de detalles
                COLOR_FOOTER_TEXT,                   // nota
                COLOR_BODY_BG,                       // footer bg
                COLOR_FOOTER_TEXT                    // footer texto
        );
    }
}
