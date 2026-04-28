package com.nolocardeno.backend.dto.processing;

import com.nolocardeno.backend.model.enums.DocumentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Normalized contract returned by any {@code DocumentExtractor}.
 * Consumers (normalizer, rules engine, pipeline) must not depend
 * on the concrete extractor implementation.
 */
public record ExtractionResult(
        ExtractionStatus status,
        ExtractionSource source,
        DocumentType detectedType,
        LocalDate issueDate,
        LocalDate expiryDate,
        String merchant,
        BigDecimal totalAmount,
        String currency,
        List<ExtractionLineItem> items,
        Map<String, FieldConfidence> confidences,
        double overallConfidence,
        String rawText,
        String holderName,
        String receiptCategory
) {
    public static ExtractionResult failed(ExtractionSource source, String rawText) {
        return new ExtractionResult(
                ExtractionStatus.FAILED,
                source,
                DocumentType.OTHER,
                null, null, null, null, null,
                List.of(), Map.of(),
                0.0,
                rawText,
                null,
                null
        );
    }
}
