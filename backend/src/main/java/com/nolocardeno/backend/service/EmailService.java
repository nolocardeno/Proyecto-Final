package com.nolocardeno.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    // --- Paleta de colores del template ---
    private static final String COLOR_PRIMARY      = "#ff9a3c";   // $color-primary
    private static final String COLOR_HEADER_TEXT  = "#171717";   // $neutral-900 (texto sobre gradiente naranja)
    private static final String COLOR_BODY_BG      = "#f7fafc";   // fondo exterior y footer
    private static final String COLOR_BODY_TEXT    = "#4a5568";   // texto principal del cuerpo
    private static final String COLOR_FOOTER_TEXT  = "#a0aec0";   // texto del footer

    private static final String COLOR_ERROR   = "#e53e3e";
    private static final String COLOR_WARNING = "#dd6b20";
    private static final String COLOR_INFO    = "#2b6cb0";

    private static final String FONT_PRIMARY = "Arial, sans-serif";

    private final JavaMailSender mailSender;

    @Value("${scantral.mail.from}")
    private String fromAddress;

    @Async
    public void sendAlertEmail(String toEmail, String userName, String documentTitle, int daysLeft) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Recordatorio: \"" + documentTitle + "\" caduca en " + daysLeft + (daysLeft == 1 ? " día" : " días"));

            helper.setText(buildEmailBody(userName, documentTitle, daysLeft), true);

            mailSender.send(message);
            log.info("Alerta enviada a {} para el documento \"{}\" ({} días restantes)", toEmail, documentTitle, daysLeft);
        } catch (MessagingException e) {
            log.error("Error al enviar alerta a {} para el documento \"{}\": {}", toEmail, documentTitle, e.getMessage());
        }
    }

    private String buildEmailBody(String userName, String documentTitle, int daysLeft) {
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
                        <td style="background-color:%s;padding:24px 32px;">
                          <h1 style="color:%s;margin:0;font-size:22px;font-weight:700;">Scantral</h1>
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
                              <td style="padding:16px 20px;">
                                <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:%s;">%s</p>
                                <p style="margin:0;font-size:15px;font-weight:700;color:%s;">%s</p>
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
                FONT_PRIMARY, COLOR_BODY_BG,            // body
                COLOR_BODY_BG,                          // outer table bg
                COLOR_PRIMARY, COLOR_HEADER_TEXT, // cabecera bg + texto
                COLOR_BODY_TEXT, userName,              // saludo
                COLOR_BODY_TEXT,                // subtítulo
                urgencyColor,                   // borde tarjeta
                COLOR_BODY_TEXT, documentTitle, // título doc
                urgencyColor, urgencyText,      // urgencia
                COLOR_FOOTER_TEXT,              // nota
                COLOR_BODY_BG,                  // footer bg
                COLOR_FOOTER_TEXT               // footer texto
        );
    }
}
