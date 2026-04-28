package com.nolocardeno.backend.service.processing;

import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionStatus;
import com.nolocardeno.backend.dto.processing.ProcessDocumentResponse;
import com.nolocardeno.backend.dto.processing.RuleOutcome;
import com.nolocardeno.backend.service.FileStorageService;
import com.nolocardeno.backend.service.processing.rules.RulesEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Orchestrates the full document-processing pipeline:
 * validate → store → extract (AI with OCR fallback) → normalize → apply rules.
 *
 * Each collaborator is decoupled behind its own interface/service so the
 * pipeline stays thin and easy to test.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentProcessingPipeline {

    private final DocumentFileValidator validator;
    private final FileStorageService fileStorageService;
    private final ExtractionDispatcher dispatcher;
    private final DocumentNormalizer normalizer;
    private final RulesEngine rulesEngine;

    @Value("${scantral.processing.review-threshold:0.7}")
    private double reviewThreshold;

    public ProcessDocumentResponse process(MultipartFile file) {
        validator.validate(file);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("No se puede leer el archivo");
        }

        String storedPath;
        try {
            storedPath = fileStorageService.store(file);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo almacenar la imagen", e);
        }

        ExtractionResult raw = dispatcher.dispatch(bytes, file.getContentType());
        ExtractionResult normalized = normalizer.normalize(raw);
        List<RuleOutcome> outcomes = rulesEngine.evaluate(normalized);

        boolean requiresReview = normalized == null
                || normalized.status() != ExtractionStatus.SUCCESS
                || normalized.overallConfidence() < reviewThreshold;

        log.info("Document processed source={} status={} confidence={} rules={} review={}",
                normalized == null ? "null" : normalized.source(),
                normalized == null ? "null" : normalized.status(),
                normalized == null ? 0 : normalized.overallConfidence(),
                outcomes.size(),
                requiresReview);

        return new ProcessDocumentResponse(
                normalized == null ? null : normalized.source(),
                normalized == null ? ExtractionStatus.FAILED : normalized.status(),
                normalized == null ? 0.0 : normalized.overallConfidence(),
                requiresReview,
                normalized,
                outcomes,
                storedPath
        );
    }
}
