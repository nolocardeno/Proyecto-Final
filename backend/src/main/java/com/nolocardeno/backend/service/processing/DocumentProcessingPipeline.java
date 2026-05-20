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
    private final PdfPageConverter pdfConverter;

    @Value("${scantral.processing.review-threshold:0.7}")
    private double reviewThreshold;

    public ProcessDocumentResponse process(MultipartFile file) {
        return process(file, false);
    }

    public ProcessDocumentResponse process(MultipartFile file, boolean useAi) {
        return process(file, useAi, true);
    }

    /**
     * Ejecuta la extracción sin persistir la imagen en disco. Se usa cuando
     * solo necesitamos los datos detectados para prerellenar el formulario
     * del frontend; la imagen definitiva se subirá cuando el usuario
     * confirme la creación del documento.
     */
    public ProcessDocumentResponse processForPreview(MultipartFile file, boolean useAi) {
        return process(file, useAi, false);
    }

    private ProcessDocumentResponse process(MultipartFile file, boolean useAi, boolean storeImage) {
        // effectiveMime is derived from magic bytes — reliable even when
        // Safari/iOS misreports HEIC files as image/jpeg.
        String effectiveMime = validator.validate(file);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("No se puede leer el archivo");
        }

        // PDFs cannot be sent directly to the OCR sidecar or the AI extractor
        // via inline_data images. Convert first page to PNG so the rest of
        // the pipeline handles it uniformly as an image.
        boolean wasPdf = "application/pdf".equals(effectiveMime);
        if (wasPdf) {
            bytes = pdfConverter.firstPageAsPng(bytes);
            effectiveMime = "image/png";
        }

        String storedPath = null;
        if (storeImage) {
            try {
                storedPath = fileStorageService.storeConvertingPdf(file);
            } catch (IOException e) {
                throw new IllegalStateException("No se pudo almacenar la imagen", e);
            }
        }

        ExtractionResult raw = dispatcher.dispatch(bytes, effectiveMime, useAi);
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
