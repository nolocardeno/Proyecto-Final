package com.nolocardeno.backend.service;

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
     * Se ejecuta cada día a las 08:00 (hora del servidor).
     * Para cada alerta activa, calcula si hoy es el día en que debe dispararse
     * (es decir, la fecha de caducidad del documento == hoy + daysBeforeExpiry).
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void processAlerts() {
        LocalDate today = LocalDate.now();
        log.info("Procesando alertas de caducidad para la fecha: {}", today);

        // Obtener todos los valores únicos de daysBeforeExpiry presentes en BD
        // y para cada uno, buscar los documentos que caducan en exactamente esos días
        List<Integer> distinctDays = alertRepository.findAll()
                .stream()
                .map(DocumentAlert::getDaysBeforeExpiry)
                .distinct()
                .toList();

        for (int days : distinctDays) {
            LocalDate targetDate = today.plusDays(days);
            List<DocumentAlert> alerts = alertRepository.findAlertsToFire(targetDate, today);

            for (DocumentAlert alert : alerts) {
                String userEmail = alert.getUser().getEmail();
                String userName = alert.getUser().getName();
                String docTitle = alert.getDocument().getTitle();

                emailService.sendAlertEmail(userEmail, userName, docTitle, days);

                alert.setNotifiedAt(LocalDateTime.now());
                alertRepository.save(alert);
            }

            if (!alerts.isEmpty()) {
                log.info("Enviadas {} alertas para documentos que caducan en {} días ({})", alerts.size(), days, targetDate);
            }
        }
    }
}
