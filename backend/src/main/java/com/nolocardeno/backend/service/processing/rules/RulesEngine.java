package com.nolocardeno.backend.service.processing.rules;

import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.RuleOutcome;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Evaluates every registered rule against a normalized extraction result.
 * Open for extension (new {@link Rule} beans) and closed for modification.
 */
@Service
@RequiredArgsConstructor
public class RulesEngine {

    private final List<Rule> rules;

    public List<RuleOutcome> evaluate(ExtractionResult extraction) {
        if (extraction == null) return List.of();
        RuleContext ctx = new RuleContext(extraction, LocalDate.now());
        return rules.stream()
                .filter(r -> safeApplies(r, ctx))
                .map(r -> safeApply(r, ctx))
                .filter(o -> o != null)
                .toList();
    }

    private boolean safeApplies(Rule r, RuleContext ctx) {
        try {
            return r.appliesTo(ctx);
        } catch (Exception e) {
            return false;
        }
    }

    private RuleOutcome safeApply(Rule r, RuleContext ctx) {
        try {
            return r.apply(ctx);
        } catch (Exception e) {
            return null;
        }
    }
}
