package com.nolocardeno.backend.service.processing;

import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Decides between the primary AI extractor and the OCR fallback.
 *
 * Policy: the AI extractor (Gemini) is always preferred. OCR is only
 * activated when the AI fails outright — either by throwing an exception
 * or by returning {@link ExtractionStatus#FAILED}. Low-confidence results
 * from the AI are still returned as-is so the reviewer UI can surface them.
 */
@Service
@Slf4j
public class ExtractionDispatcher {

    private final AIDocumentExtractor aiExtractor;
    private final OcrDocumentExtractor ocrExtractor;

    public ExtractionDispatcher(
            AIDocumentExtractor aiExtractor,
            OcrDocumentExtractor ocrExtractor
    ) {
        this.aiExtractor = aiExtractor;
        this.ocrExtractor = ocrExtractor;
    }

    public ExtractionResult dispatch(byte[] image, String mime) {
        ExtractionResult aiResult = tryAi(image, mime);

        if (aiResult != null && aiResult.status() != ExtractionStatus.FAILED) {
            return aiResult;
        }

        log.info("AI extraction unavailable (status={}). Activating OCR fallback.",
                aiResult == null ? "null" : aiResult.status());
        return ocrExtractor.extract(image, mime);
    }

    private ExtractionResult tryAi(byte[] image, String mime) {
        try {
            return aiExtractor.extract(image, mime);
        } catch (ExtractionException e) {
            log.warn("AI extractor failed: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Unexpected AI extractor error", e);
            return null;
        }
    }
}
