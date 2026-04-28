package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.processing.ProcessDocumentResponse;
import com.nolocardeno.backend.service.processing.DocumentProcessingPipeline;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST entry point for the AI + OCR document processing pipeline.
 *
 * Flow:
 *   1. Frontend uploads image (multipart/form-data).
 *   2. Pipeline validates → stores → extracts (AI, OCR fallback) → normalizes → applies rules.
 *   3. Response includes extracted data, rule outcomes, confidence and review flag.
 */
@RestController
@RequestMapping("/api/documents/processing")
@RequiredArgsConstructor
public class DocumentProcessingController {

    private final DocumentProcessingPipeline pipeline;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProcessDocumentResponse> analyze(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(pipeline.process(file));
    }
}
