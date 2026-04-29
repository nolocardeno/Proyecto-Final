package com.nolocardeno.backend.service.processing.rules;

import com.nolocardeno.backend.dto.processing.ExtractionResult;

import java.time.LocalDate;

/**
 * Input contract for every rule. The rules engine is the sole owner of the
 * "today" clock so rules remain deterministic and easy to test.
 */
public record RuleContext(ExtractionResult extraction, LocalDate today) {
}
