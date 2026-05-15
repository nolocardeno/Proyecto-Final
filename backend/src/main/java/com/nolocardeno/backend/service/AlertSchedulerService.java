package com.nolocardeno.backend.service;

import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentAlert;
import com.nolocardeno.backend.repository.DocumentAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertSchedulerService {

    private final DocumentAlertRepository alertRepository;
    private final EmailService emailService;

    /**
     * Se ejecuta cada día a las 08:00 hora española (Europe/Madrid).
     * En UTC: 06:00 en verano (CEST, UTC+2) y 07:00 en invierno (CET, UTC+1).
     * El contenedor Docker corre en UTC, por lo que se usa la expresión UTC.
     */
    @Scheduled(cron = "0 0 6 * * *", zone = "Europe/Madrid")
    @Transactional
    public void processAlerts() {
        LocalDate today = LocalDate.now();
        log.info("Procesando alertas de caducidad para la fecha: {}", today);

        List<Integer> distinctDays = alertRepository.findDistinctDaysBeforeExpiry();

        for (int days : distinctDays) {
            LocalDate targetDate = today.plusDays(days);
            List<DocumentAlert> alerts = alertRepository.findAlertsToFire(targetDate, days, today);

            for (DocumentAlert alert : alerts) {
                String userEmail = alert.getUser().getEmail();
                String userName  = alert.getUser().getName();
                Document doc     = alert.getDocument();

                boolean sent = emailService.sendAlertEmail(
                        userEmail, userName,
                        doc.getTitle(),
                        doc.getStoreName(),
                        doc.getType() != null ? doc.getType().name() : null,
                        doc.getCategory(),
                        doc.getIssueDate(),
                        doc.getExpiryDate(),
                        days
                );
                if (sent) {
                    alert.setNotifiedAt(LocalDateTime.now());
                    alertRepository.save(alert);
                }
            }

            if (!alerts.isEmpty()) {
                log.info("Procesadas {} alertas para documentos que caducan en {} días ({})", alerts.size(), days, targetDate);
            }
        }
    }
}
