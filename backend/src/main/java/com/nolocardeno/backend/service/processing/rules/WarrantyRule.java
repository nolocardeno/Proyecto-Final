package com.nolocardeno.backend.service.processing.rules;

import com.nolocardeno.backend.dto.processing.ExtractionLineItem;
import com.nolocardeno.backend.dto.processing.RuleOutcome;
import com.nolocardeno.backend.dto.processing.RuleStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;

/**
 * EU legal warranty (default 2 years from purchase date).
 * The duration can be extended per product category — the category comes
 * from the AI extractor when available.
 */
@Component
public class WarrantyRule implements Rule {

    private static final EnumSet<DocumentType> SUPPORTED =
            EnumSet.of(DocumentType.RECEIPT, DocumentType.INVOICE, DocumentType.WARRANTY);

    @Override
    public String code() {
        return "WARRANTY_EU";
    }

    @Override
    public boolean appliesTo(RuleContext ctx) {
        var e = ctx.extraction();
        return SUPPORTED.contains(e.detectedType()) && e.issueDate() != null;
    }

    @Override
    public RuleOutcome apply(RuleContext ctx) {
        var e = ctx.extraction();
        LocalDate issue = e.issueDate();
        int years = inferYears(e.items());
        LocalDate until = issue.plusYears(years);
        long days = ChronoUnit.DAYS.between(ctx.today(), until);

        RuleStatus status;
        if (days < 0) status = RuleStatus.EXPIRED;
        else if (days < 30) status = RuleStatus.EXPIRING_SOON;
        else status = RuleStatus.ACTIVE;

        return new RuleOutcome(
                code(),
                "Garantía legal",
                until,
                days,
                status,
                "Garantía legal UE de " + years + " años desde la fecha de compra."
        );
    }

    private int inferYears(List<ExtractionLineItem> items) {
        if (items == null) return 2;
        for (ExtractionLineItem it : items) {
            String cat = it.category() == null ? "" : it.category().toLowerCase(Locale.ROOT);
            if (cat.contains("construc") || cat.contains("inmueble")) return 10;
            if (cat.contains("vehic") || cat.contains("coche") || cat.contains("car")) return 3;
        }
        return 2;
    }
}
