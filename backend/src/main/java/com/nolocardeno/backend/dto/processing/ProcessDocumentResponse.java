package com.nolocardeno.backend.dto.processing;

import java.util.List;

/**
 * Response returned to the frontend after processing an uploaded document image.
 * Contains the extracted data, detected source (AI/OCR), confidence and the
 * list of rule outcomes produced by the rules engine.
 */
public record ProcessDocumentResponse(
        ExtractionSource source,
        ExtractionStatus status,
        double overallConfidence,
        boolean requiresUserReview,
        ExtractionResult data,
        List<RuleOutcome> rules,
        String imagePath
) {
}
