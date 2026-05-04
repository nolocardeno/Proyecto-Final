package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.DocumentAlertRequest;
import com.nolocardeno.backend.dto.DocumentAlertResponse;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentAlert;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.DocumentAlertRepository;
import com.nolocardeno.backend.repository.DocumentRepository;
import com.nolocardeno.backend.repository.GroupRepository;
import com.nolocardeno.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentAlertServiceTest {

    @Mock DocumentAlertRepository alertRepository;
    @Mock DocumentRepository documentRepository;
    @Mock UserRepository userRepository;
    @Mock GroupRepository groupRepository;
    @InjectMocks DocumentAlertService service;

    private User user(long id) { return User.builder().id(id).email(id + "@x.com").role(Role.USER).build(); }

    private Document doc(long id, User owner, LocalDate expiry) {
        return Document.builder().id(id).user(owner).title("t").expiryDate(expiry).build();
    }

    @Test
    void getAlerts_returns_owner_alerts() {
        User u = user(1L);
        Document d = doc(10L, u, LocalDate.now().plusDays(10));
        when(documentRepository.findById(10L)).thenReturn(Optional.of(d));
        when(alertRepository.findByDocumentIdAndUserId(10L, 1L)).thenReturn(List.of(
                DocumentAlert.builder().id(1L).document(d).user(u).daysBeforeExpiry(7).build()
        ));

        List<DocumentAlertResponse> alerts = service.getAlerts(1L, 10L);
        assertThat(alerts).hasSize(1);
    }

    @Test
    void getAlerts_throws_403_when_not_owner_or_member() {
        Document d = doc(10L, user(1L), LocalDate.now().plusDays(10));
        when(documentRepository.findById(10L)).thenReturn(Optional.of(d));
        when(groupRepository.existsByDocumentsIdAndMembersId(10L, 99L)).thenReturn(false);
        assertThatThrownBy(() -> service.getAlerts(99L, 10L)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getAlerts_throws_when_doc_missing() {
        when(documentRepository.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getAlerts(1L, 404L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createAlert_persists_and_returns_response() {
        User u = user(1L);
        Document d = doc(10L, u, LocalDate.now().plusDays(10));
        when(documentRepository.findById(10L)).thenReturn(Optional.of(d));
        when(alertRepository.findByDocumentIdAndUserIdAndDaysBeforeExpiry(10L, 1L, 7)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(alertRepository.save(any(DocumentAlert.class))).thenAnswer(inv -> {
            DocumentAlert a = inv.getArgument(0);
            a.setId(99L);
            return a;
        });
        DocumentAlertRequest req = new DocumentAlertRequest();
        req.setDaysBeforeExpiry(7);

        DocumentAlertResponse resp = service.createAlert(1L, 10L, req);

        assertThat(resp.getId()).isEqualTo(99L);
        assertThat(resp.getDaysBeforeExpiry()).isEqualTo(7);
    }

    @Test
    void createAlert_rejects_when_no_expiry_date() {
        User u = user(1L);
        Document d = doc(10L, u, null);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(d));

        DocumentAlertRequest req = new DocumentAlertRequest();
        req.setDaysBeforeExpiry(7);

        assertThatThrownBy(() -> service.createAlert(1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void createAlert_rejects_duplicate_days() {
        User u = user(1L);
        Document d = doc(10L, u, LocalDate.now().plusDays(10));
        when(documentRepository.findById(10L)).thenReturn(Optional.of(d));
        when(alertRepository.findByDocumentIdAndUserIdAndDaysBeforeExpiry(10L, 1L, 7))
                .thenReturn(Optional.of(DocumentAlert.builder().build()));
        DocumentAlertRequest req = new DocumentAlertRequest();
        req.setDaysBeforeExpiry(7);

        assertThatThrownBy(() -> service.createAlert(1L, 10L, req))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void deleteAlert_deletes_owned_alert() {
        User u = user(1L);
        Document d = doc(10L, u, LocalDate.now().plusDays(10));
        DocumentAlert a = DocumentAlert.builder().id(5L).user(u).document(d).build();
        when(documentRepository.findById(10L)).thenReturn(Optional.of(d));
        when(alertRepository.findById(5L)).thenReturn(Optional.of(a));

        service.deleteAlert(1L, 10L, 5L);

        verify(alertRepository).delete(a);
    }

    @Test
    void deleteAlert_rejects_non_owner_alert() {
        User u = user(1L);
        Document d = doc(10L, u, LocalDate.now().plusDays(10));
        DocumentAlert a = DocumentAlert.builder().id(5L).user(user(2L)).document(d).build();
        when(documentRepository.findById(10L)).thenReturn(Optional.of(d));
        when(alertRepository.findById(5L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteAlert(1L, 10L, 5L))
                .isInstanceOf(ResponseStatusException.class);
    }
}
