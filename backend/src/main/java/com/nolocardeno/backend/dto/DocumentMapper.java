package com.nolocardeno.backend.dto;

import com.nolocardeno.backend.model.DocumentHistory;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

public final class DocumentMapper {

    private DocumentMapper() {
    }

    public static DocumentResponse toResponse(com.nolocardeno.backend.model.Document doc) {
        Long daysRemaining = null;
        if (doc.getExpiryDate() != null) {
            daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(ZoneId.of("Europe/Madrid")), doc.getExpiryDate());
        }

        return DocumentResponse.builder()
                .id(doc.getId())
                .type(doc.getType())
                .title(doc.getTitle())
                .category(doc.getCategory())
                .storeName(doc.getStoreName())
                .amount(doc.getAmount())
                .issueDate(doc.getIssueDate())
                .expiryDate(doc.getExpiryDate())
                .daysRemaining(daysRemaining)
                .imagePath(doc.getImagePath())
                .aiProcessed(doc.getAiProcessed())
                .notes(doc.getNotes())
                .status(doc.getStatus())
                .duplicateOfId(doc.getDuplicateOf() != null ? doc.getDuplicateOf().getId() : null)
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    public static RenewalHistoryResponse toRenewalResponse(com.nolocardeno.backend.model.RenewalHistory rh) {
        return RenewalHistoryResponse.builder()
                .id(rh.getId())
                .documentId(rh.getDocument().getId())
                .previousExpiryDate(rh.getPreviousExpiryDate())
                .newExpiryDate(rh.getNewExpiryDate())
                .renewedAt(rh.getRenewedAt())
                .notes(rh.getNotes())
                .build();
    }

    public static DocumentHistoryResponse toHistoryResponse(DocumentHistory dh) {
        return DocumentHistoryResponse.builder()
                .id(dh.getId())
                .documentId(dh.getDocument().getId())
                .changeType(dh.getChangeType())
                .description(dh.getDescription())
                .changedByName(dh.getChangedBy().getName())
                .changedAt(dh.getChangedAt())
                .build();
    }
}
