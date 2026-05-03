package com.nolocardeno.backend.service.processing;

import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Decides between the OCR extractor (default) and the optional AI extractor.
 *
 * Policy: OCR is the primary extractor. The AI extractor (Gemini) is only
 * used when the caller opts in by setting {@code useAi=true}; in that case
 * AI is tried first and OCR acts as a fallback when AI fails.
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

    public ExtractionResult dispatch(byte[] image, String mime, boolean useAi) {
        if (useAi) {
            ExtractionResult aiResult = tryAi(image, mime);
            if (aiResult != null && aiResult.status() != ExtractionStatus.FAILED) {
                return aiResult;
            }
            log.info("AI extraction unavailable (status={}). Falling back to OCR.",
                    aiResult == null ? "null" : aiResult.status());
        }
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
