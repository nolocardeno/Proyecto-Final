package com.nolocardeno.backend.dto.processing;

public record FieldConfidence(double score, String notes) {
    public static FieldConfidence of(double score) {
        return new FieldConfidence(score, null);
    }
}
