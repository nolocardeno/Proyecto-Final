package com.nolocardeno.backend.service.processing.rules;

import com.nolocardeno.backend.dto.processing.RuleOutcome;

/**
 * A single business rule. Rules must be independent from each other and from
 * the extraction layer (AI / OCR). Add a new {@code @Component} implementing
 * this interface to extend the engine without modifying the pipeline.
 */
public interface Rule {

    String code();

    boolean appliesTo(RuleContext ctx);

    RuleOutcome apply(RuleContext ctx);
}
