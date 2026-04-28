package com.nolocardeno.backend.service.processing;

import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionSource;

/**
 * Strategy contract implemented by every extraction engine (AI, OCR, ...).
 * Implementations MUST be independent from each other and from the rules engine.
 */
public interface DocumentExtractor {

    ExtractionResult extract(byte[] image, String mimeType);

    ExtractionSource source();
}
