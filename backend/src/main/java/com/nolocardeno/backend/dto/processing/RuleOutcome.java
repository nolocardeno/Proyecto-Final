package com.nolocardeno.backend.dto.processing;

import java.time.LocalDate;

public record RuleOutcome(
        String ruleCode,
        String label,
        LocalDate validUntil,
        long daysRemaining,
        RuleStatus status,
        String explanation
) {
}
