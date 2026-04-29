package com.nolocardeno.backend.service.processing.rules;

import com.nolocardeno.backend.dto.processing.RuleOutcome;
import com.nolocardeno.backend.dto.processing.RuleStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import com.nolocardeno.backend.service.processing.OcrTextParser;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;

/**
 * Return-window rule. Clothing receipts from well-known Spanish retailers
 * get a 15-day window (common high-street policy); other retail receipts
 * default to 14 days.
 */
@Component
public class ReturnWindowRule implements Rule {

    private static final int CLOTHING_DAYS = 15;
    private static final int DEFAULT_DAYS = 14;

    private static final EnumSet<DocumentType> SUPPORTED =
            EnumSet.of(DocumentType.RECEIPT, DocumentType.INVOICE);

    @Override
    public String code() {
        return "RETURN_WINDOW";
    }

    @Override
    public boolean appliesTo(RuleContext ctx) {
        var e = ctx.extraction();
        return SUPPORTED.contains(e.detectedType()) && e.issueDate() != null;
    }

    @Override
    public RuleOutcome apply(RuleContext ctx) {
        var e = ctx.extraction();
        boolean clothing = OcrTextParser.looksLikeClothing(e.rawText());
        int days = clothing ? CLOTHING_DAYS : DEFAULT_DAYS;

        LocalDate until = e.issueDate().plusDays(days);
        long remaining = ChronoUnit.DAYS.between(ctx.today(), until);

        RuleStatus status = remaining < 0 ? RuleStatus.EXPIRED : RuleStatus.ACTIVE;

        String explanation = clothing
                ? "Plazo de devolución de " + days + " días (política estándar de ropa en España)."
                : "Plazo genérico de " + days + " días (ampliable por comercio).";

        return new RuleOutcome(
                code(),
                "Plazo de devolución",
                until,
                remaining,
                status,
                explanation
        );
    }
}
