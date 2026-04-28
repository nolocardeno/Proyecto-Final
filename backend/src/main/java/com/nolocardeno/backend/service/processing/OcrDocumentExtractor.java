package com.nolocardeno.backend.service.processing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionSource;
import com.nolocardeno.backend.dto.processing.ExtractionStatus;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * Fallback extractor — sends the raw image to the PaddleOCR sidecar
 * microservice and feeds the recognised plain text into {@link OcrTextParser}.
 *
 * Replaces the legacy Tesseract / Tess4J integration. PaddleOCR (PP-OCRv4)
 * is a much more modern engine, multilingual, and CPU-friendly. We isolate
 * it in a separate Python container so the Spring backend stays a pure JVM
 * service with no native dependencies.
 *
 * If the sidecar is unreachable or returns no usable text, this extractor
 * returns {@link ExtractionStatus#FAILED} so the pipeline can respond with
 * a controlled error to the frontend.
 */
@Service
@Slf4j
public class OcrDocumentExtractor implements DocumentExtractor {

    private final OcrTextParser parser;
    private final RestClient http;
    private final String serviceUrl;
    private final ObjectMapper mapper = new ObjectMapper();

    public OcrDocumentExtractor(
            @Value("${scantral.ocr.url:http://localhost:8001}") String serviceUrl,
            @Value("${scantral.ocr.timeout-ms:30000}") int timeoutMs,
            OcrTextParser parser
    ) {
        this.serviceUrl = stripTrailingSlash(serviceUrl);
        this.parser = parser;
        // Explicit per-request timeout so a hung sidecar can't stall the API.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Math.min(timeoutMs, 10_000));
        factory.setReadTimeout(timeoutMs);
        this.http = RestClient.builder().requestFactory(factory).build();
    }

    @PostConstruct
    void logConfig() {
        log.info("OCR fallback configured -> PaddleOCR sidecar at {}", serviceUrl);
    }

    @Override
    public ExtractionSource source() {
        return ExtractionSource.OCR;
    }

    @Override
    public ExtractionResult extract(byte[] image, String mimeType) {
        try {
            String body = callSidecar(image, mimeType);
            if (body == null || body.isBlank()) {
                log.warn("PaddleOCR returned an empty body");
                return ExtractionResult.failed(ExtractionSource.OCR, null);
            }
            JsonNode node = mapper.readTree(body);
            String text = node.path("text").asText("");
            double avgConf = node.path("averageConfidence").asDouble(0.0);
            int lineCount = node.path("lines").isArray() ? node.path("lines").size() : 0;

            if (text.isBlank()) {
                log.warn("PaddleOCR produced no text (lines={}, avgConf={})",
                        lineCount, avgConf);
                return ExtractionResult.failed(ExtractionSource.OCR, text);
            }
            log.info("PaddleOCR extracted {} chars across {} lines (avgConf={})",
                    text.length(), lineCount, String.format("%.3f", avgConf));
            return parser.parse(text);
        } catch (ResourceAccessException e) {
            log.error("PaddleOCR sidecar unreachable at {}: {}", serviceUrl, e.getMessage());
            return ExtractionResult.failed(ExtractionSource.OCR, null);
        } catch (Throwable t) {
            log.error("OCR failure: {}", t.getMessage(), t);
            return ExtractionResult.failed(ExtractionSource.OCR, null);
        }
    }

    private String callSidecar(byte[] image, String mimeType) {
        String filename = filenameFor(mimeType);
        ByteArrayResource resource = new ByteArrayResource(image) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", resource);

        return http.post()
                .uri(serviceUrl + "/ocr")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(form)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new ExtractionException(
                            "PaddleOCR returned HTTP " + resp.getStatusCode());
                })
                .body(String.class);
    }

    private String filenameFor(String mimeType) {
        if (mimeType == null) return "image.jpg";
        String mt = mimeType.toLowerCase();
        if (mt.contains("png")) return "image.png";
        if (mt.contains("webp")) return "image.webp";
        if (mt.contains("tiff")) return "image.tiff";
        return "image.jpg";
    }

    private static String stripTrailingSlash(String url) {
        if (url == null || url.isBlank()) return url;
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
