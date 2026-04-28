package com.nolocardeno.backend.service.processing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nolocardeno.backend.dto.processing.ExtractionLineItem;
import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionSource;
import com.nolocardeno.backend.dto.processing.ExtractionStatus;
import com.nolocardeno.backend.dto.processing.FieldConfidence;
import com.nolocardeno.backend.model.enums.DocumentType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Primary extractor — delegates understanding to Google Gemini (multimodal LLM).
 * Returns an {@link ExtractionResult} with per-field confidence. If the API
 * key is not configured, the call fails, or the JSON is invalid, an
 * {@link ExtractionException} is raised so the dispatcher can transparently
 * activate the OCR fallback.
 */
@Service
@Slf4j
public class AIDocumentExtractor implements DocumentExtractor {

    private final ObjectMapper mapper = new ObjectMapper();
    private final RestClient http;
    private final String apiKey;
    private final String model;
    private final String apiUrl;
    private final int timeoutMs;

    public AIDocumentExtractor(
            @Value("${scantral.ai.api-key:}") String apiKey,
            @Value("${scantral.ai.model:gemini-2.5-flash-lite}") String model,
            @Value("${scantral.ai.url:https://generativelanguage.googleapis.com/v1beta/models}") String apiUrl,
            @Value("${scantral.ai.timeout-ms:30000}") int timeoutMs
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
        this.timeoutMs = timeoutMs;
        this.http = RestClient.builder().build();
    }

    @Override
    public ExtractionSource source() {
        return ExtractionSource.AI;
    }

    @Override
    public ExtractionResult extract(byte[] image, String mimeType) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ExtractionException("AI extractor disabled: no API key configured");
        }
        String json = callGemini(image, mimeType);
        return parse(json);
    }

    private String callGemini(byte[] image, String mimeType) {
        String base64 = Base64.getEncoder().encodeToString(image);
        String effectiveMime = mimeType == null ? "image/jpeg" : mimeType;

        Map<String, Object> textPart = Map.of("text", AIPromptBuilder.buildSystemPrompt());
        Map<String, Object> imagePart = Map.of(
                "inline_data", Map.of("mime_type", effectiveMime, "data", base64)
        );
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(textPart, imagePart)
                )),
                "generationConfig", Map.of(
                        "temperature", 0,
                        "responseMimeType", "application/json"
                )
        );

        // Gemini REST endpoint: {baseUrl}/{model}:generateContent?key={apiKey}
        String base = apiUrl.endsWith("/") ? apiUrl.substring(0, apiUrl.length() - 1) : apiUrl;
        String url = base + "/" + model + ":generateContent?key=" + apiKey;

        // Retry on transient errors (503 UNAVAILABLE, 429 rate limit, 500, 502, 504).
        int maxAttempts = 4;
        long backoffMs = 800L;
        Exception lastError = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> response = http.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(Map.class);

                if (response == null) throw new ExtractionException("Empty response from Gemini");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates =
                        (List<Map<String, Object>>) response.get("candidates");
                if (candidates == null || candidates.isEmpty()) {
                    throw new ExtractionException("Gemini response has no candidates");
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content == null) throw new ExtractionException("Gemini candidate has no content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts == null || parts.isEmpty()) {
                    throw new ExtractionException("Gemini content has no parts");
                }
                String text = (String) parts.get(0).get("text");
                if (text == null || text.isBlank()) {
                    throw new ExtractionException("Gemini text part is empty");
                }
                return stripCodeFences(text);
            } catch (org.springframework.web.client.HttpStatusCodeException httpEx) {
                int status = httpEx.getStatusCode().value();
                String responseBody = httpEx.getResponseBodyAsString();
                // Daily-quota 429s (RESOURCE_EXHAUSTED) are not worth retrying:
                // the backoff delay is too short to matter. Bail out immediately
                // so the OCR fallback kicks in without extra latency.
                boolean quotaExhausted = status == 429
                        && responseBody != null
                        && responseBody.contains("RESOURCE_EXHAUSTED");
                boolean transientError = !quotaExhausted
                        && (status == 429 || status == 500 || status == 502
                                || status == 503 || status == 504);
                lastError = httpEx;
                if (!transientError || attempt == maxAttempts) {
                    String reason = quotaExhausted
                            ? "Gemini daily quota exhausted (free tier). "
                                    + "Switch model to gemini-2.5-flash-lite or enable billing."
                            : "Gemini call failed (status " + status + "): " + httpEx.getMessage();
                    throw new ExtractionException(reason, httpEx);
                }
                log.warn("Gemini returned {} on attempt {}/{}. Retrying in {}ms.",
                        status, attempt, maxAttempts, backoffMs);
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new ExtractionException("Gemini retry interrupted", ie);
                }
                backoffMs *= 2;
            } catch (ExtractionException e) {
                throw e;
            } catch (Exception e) {
                throw new ExtractionException("Gemini call failed: " + e.getMessage(), e);
            }
        }
        throw new ExtractionException("Gemini call failed after " + maxAttempts + " attempts",
                lastError);
    }

    private String stripCodeFences(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            int firstNl = t.indexOf('\n');
            if (firstNl > 0) t = t.substring(firstNl + 1);
            if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }

    ExtractionResult parse(String json) {
        try {
            JsonNode n = mapper.readTree(json);

            DocumentType type = parseType(n.path("detectedType").asText("OTHER"));
            LocalDate issue = parseDate(n.path("issueDate"));
            LocalDate expiry = parseDate(n.path("expiryDate"));
            String merchant = n.hasNonNull("merchant") ? n.get("merchant").asText() : null;
            BigDecimal amount = n.hasNonNull("totalAmount") ? n.get("totalAmount").decimalValue() : null;
            String currency = n.hasNonNull("currency") ? n.get("currency").asText() : null;

            List<ExtractionLineItem> items = new ArrayList<>();
            if (n.path("items").isArray()) {
                for (JsonNode it : n.path("items")) {
                    items.add(new ExtractionLineItem(
                            it.path("description").asText(null),
                            it.hasNonNull("price") ? it.get("price").decimalValue() : null,
                            it.hasNonNull("qty") ? it.get("qty").asInt() : null,
                            it.hasNonNull("category") ? it.get("category").asText() : null
                    ));
                }
            }

            Map<String, FieldConfidence> confidences = new HashMap<>();
            JsonNode cn = n.path("confidences");
            if (cn.isObject()) {
                Iterator<String> it = cn.fieldNames();
                while (it.hasNext()) {
                    String f = it.next();
                    confidences.put(f, FieldConfidence.of(cn.get(f).asDouble(0.0)));
                }
            }

            double overall = n.path("overallConfidence").asDouble(0.0);
            ExtractionStatus status;
            if (overall <= 0) {
                status = ExtractionStatus.FAILED;
            } else if (overall < 0.5) {
                status = ExtractionStatus.LOW_CONFIDENCE;
            } else {
                status = ExtractionStatus.SUCCESS;
            }

            String holderName = n.hasNonNull("holderName") ? n.get("holderName").asText() : null;
            String receiptCategory = n.hasNonNull("receiptCategory")
                    ? n.get("receiptCategory").asText() : null;

            return new ExtractionResult(
                    status, ExtractionSource.AI, type,
                    issue, expiry, merchant, amount,
                    currency == null ? null : currency.toUpperCase(Locale.ROOT),
                    items, confidences, overall, null,
                    holderName,
                    receiptCategory
            );
        } catch (Exception e) {
            throw new ExtractionException("Could not parse AI JSON response", e);
        }
    }

    private DocumentType parseType(String raw) {
        if (raw == null) return DocumentType.OTHER;
        try {
            return DocumentType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return DocumentType.OTHER;
        }
    }

    private LocalDate parseDate(JsonNode node) {
        if (node == null || node.isNull() || node.asText().isBlank()) return null;
        try {
            return LocalDate.parse(node.asText());
        } catch (Exception e) {
            return null;
        }
    }
}
