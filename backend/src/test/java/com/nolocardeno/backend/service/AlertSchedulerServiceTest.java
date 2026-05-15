package com.nolocardeno.backend.service;

import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentAlert;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.DocumentAlertRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertSchedulerServiceTest {

    @Mock DocumentAlertRepository alertRepository;
    @Mock EmailService emailService;
    @InjectMocks AlertSchedulerService scheduler;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private User user(String email) {
        return User.builder().id(1L).email(email).name("Test User").role(Role.USER).build();
    }

    private Document doc(LocalDate expiry) {
        return Document.builder().id(10L).title("DNI").expiryDate(expiry).user(user("u@x.com")).build();
    }

    private DocumentAlert alert(int days, LocalDate expiry) {
        User u = user("u@x.com");
        return DocumentAlert.builder()
                .id(1L)
                .user(u)
                .document(doc(expiry))
                .daysBeforeExpiry(days)
                .notifiedAt(null)
                .build();
    }

    // -----------------------------------------------------------------------
    // Caso 1: email enviado → notifiedAt se guarda
    // -----------------------------------------------------------------------

    @Test
    void whenEmailSucceeds_thenNotifiedAtIsSaved() {
        LocalDate today = LocalDate.now();
        LocalDate expiry = today.plusDays(1);

        DocumentAlert a = alert(1, expiry);
        when(alertRepository.findDistinctDaysBeforeExpiry()).thenReturn(List.of(1));
        when(alertRepository.findAlertsToFire(expiry, 1, today)).thenReturn(List.of(a));
        when(emailService.sendAlertEmail(anyString(), anyString(), anyString(),
                any(), any(), any(), any(), any(), eq(1))).thenReturn(true);

        scheduler.processAlerts();

        ArgumentCaptor<DocumentAlert> captor = ArgumentCaptor.forClass(DocumentAlert.class);
        verify(alertRepository).save(captor.capture());
        assertThat(captor.getValue().getNotifiedAt()).isNotNull();
    }

    // -----------------------------------------------------------------------
    // Caso 2: email falla → notifiedAt NO se guarda (alerta se reintentará)
    // -----------------------------------------------------------------------

    @Test
    void whenEmailFails_thenNotifiedAtIsNotSaved() {
        LocalDate today = LocalDate.now();
        LocalDate expiry = today.plusDays(1);

        DocumentAlert a = alert(1, expiry);
        when(alertRepository.findDistinctDaysBeforeExpiry()).thenReturn(List.of(1));
        when(alertRepository.findAlertsToFire(expiry, 1, today)).thenReturn(List.of(a));
        when(emailService.sendAlertEmail(anyString(), anyString(), anyString(),
                any(), any(), any(), any(), any(), eq(1))).thenReturn(false);

        scheduler.processAlerts();

        verify(alertRepository, never()).save(any());
        assertThat(a.getNotifiedAt()).isNull();
    }

    // -----------------------------------------------------------------------
    // Caso 3: sin alertas pendientes → no se envía nada
    // -----------------------------------------------------------------------

    @Test
    void whenNoAlertsDue_thenNoEmailIsSent() {
        when(alertRepository.findDistinctDaysBeforeExpiry()).thenReturn(List.of(1));
        when(alertRepository.findAlertsToFire(any(), eq(1), any())).thenReturn(List.of());

        scheduler.processAlerts();

        verify(emailService, never()).sendAlertEmail(any(), any(), any(), any(), any(), any(), any(), any(), anyInt());
        verify(alertRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // Caso 4: no hay alertas registradas en absoluto
    // -----------------------------------------------------------------------

    @Test
    void whenNoAlertsExist_thenNothingHappens() {
        when(alertRepository.findDistinctDaysBeforeExpiry()).thenReturn(List.of());

        scheduler.processAlerts();

        verify(emailService, never()).sendAlertEmail(any(), any(), any(), any(), any(), any(), any(), any(), anyInt());
    }

    // -----------------------------------------------------------------------
    // Caso 5: cada alerta se consulta con su propio daysBeforeExpiry
    //         (verifica que el filtro se pasa correctamente al repositorio)
    // -----------------------------------------------------------------------

    @Test
    void eachDistinctDayQueriesRepositoryWithCorrectDaysAndTargetDate() {
        LocalDate today = LocalDate.now();

        when(alertRepository.findDistinctDaysBeforeExpiry()).thenReturn(List.of(1, 7));
        when(alertRepository.findAlertsToFire(any(), anyInt(), any())).thenReturn(List.of());

        scheduler.processAlerts();

        verify(alertRepository).findAlertsToFire(today.plusDays(1), 1, today);
        verify(alertRepository).findAlertsToFire(today.plusDays(7), 7, today);
    }

    // -----------------------------------------------------------------------
    // Caso 6: varios usuarios con alertas distintas en el mismo ciclo
    // -----------------------------------------------------------------------

    @Test
    void multipleAlertsInSameCycle_allSentAndSaved() {
        LocalDate today = LocalDate.now();
        LocalDate expiry = today.plusDays(3);

        User u1 = User.builder().id(1L).email("a@x.com").name("Ana").role(Role.USER).build();
        User u2 = User.builder().id(2L).email("b@x.com").name("Bob").role(Role.USER).build();
        Document d = doc(expiry);

        DocumentAlert alert1 = DocumentAlert.builder().id(1L).user(u1).document(d).daysBeforeExpiry(3).build();
        DocumentAlert alert2 = DocumentAlert.builder().id(2L).user(u2).document(d).daysBeforeExpiry(3).build();

        when(alertRepository.findDistinctDaysBeforeExpiry()).thenReturn(List.of(3));
        when(alertRepository.findAlertsToFire(expiry, 3, today)).thenReturn(List.of(alert1, alert2));
        when(emailService.sendAlertEmail(anyString(), anyString(), anyString(),
                any(), any(), any(), any(), any(), eq(3))).thenReturn(true);

        scheduler.processAlerts();

        verify(emailService, times(2)).sendAlertEmail(anyString(), anyString(), anyString(),
                any(), any(), any(), any(), any(), eq(3));
        verify(alertRepository, times(2)).save(any());
        assertThat(alert1.getNotifiedAt()).isNotNull();
        assertThat(alert2.getNotifiedAt()).isNotNull();
    }
}
