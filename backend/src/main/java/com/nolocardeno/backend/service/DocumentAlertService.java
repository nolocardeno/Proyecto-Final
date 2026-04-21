package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.DocumentAlertRequest;
import com.nolocardeno.backend.dto.DocumentAlertResponse;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentAlert;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.repository.DocumentAlertRepository;
import com.nolocardeno.backend.repository.DocumentRepository;
import com.nolocardeno.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentAlertService {

    private final DocumentAlertRepository alertRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public List<DocumentAlertResponse> getAlerts(Long userId, Long documentId) {
        validateDocumentOwnership(userId, documentId);
        return alertRepository.findByDocumentIdAndUserId(documentId, userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DocumentAlertResponse createAlert(Long userId, Long documentId, DocumentAlertRequest request) {
        Document document = validateDocumentOwnership(userId, documentId);

        if (document.getExpiryDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "No se puede crear una alerta para un documento sin fecha de caducidad");
        }

        alertRepository.findByDocumentIdAndUserIdAndDaysBeforeExpiry(
                documentId, userId, request.getDaysBeforeExpiry())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "Ya existe una alerta para esos días");
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        DocumentAlert alert = DocumentAlert.builder()
                .document(document)
                .user(user)
                .daysBeforeExpiry(request.getDaysBeforeExpiry())
                .build();

        return toResponse(alertRepository.save(alert));
    }

    @Transactional
    public void deleteAlert(Long userId, Long documentId, Long alertId) {
        validateDocumentOwnership(userId, documentId);
        DocumentAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta no encontrada"));

        if (!alert.getUser().getId().equals(userId) || !alert.getDocument().getId().equals(documentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }

        alertRepository.delete(alert);
    }

    private Document validateDocumentOwnership(Long userId, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado"));
        if (!document.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }
        return document;
    }

    private DocumentAlertResponse toResponse(DocumentAlert alert) {
        return DocumentAlertResponse.builder()
                .id(alert.getId())
                .documentId(alert.getDocument().getId())
                .daysBeforeExpiry(alert.getDaysBeforeExpiry())
                .notifiedAt(alert.getNotifiedAt())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
