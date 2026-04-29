package com.nolocardeno.backend.service.processing.rules;

import com.nolocardeno.backend.dto.processing.RuleOutcome;
import com.nolocardeno.backend.dto.processing.RuleStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;

/**
 * Validity window for official documents (DNI, passport, driving licence,
 * ITV, insurance). Uses the extracted expiry date directly.
 */
@Component
public class OfficialDocumentExpiryRule implements Rule {

    private static final EnumSet<DocumentType> OFFICIAL = EnumSet.of(
            DocumentType.DNI,
            DocumentType.PASSPORT,
            DocumentType.DRIVING_LICENSE,
            DocumentType.ITV,
            DocumentType.INSURANCE
    );

    @Override
    public String code() {
        return "OFFICIAL_EXPIRY";
    }

    @Override
    public boolean appliesTo(RuleContext ctx) {
        var e = ctx.extraction();
        return OFFICIAL.contains(e.detectedType()) && e.expiryDate() != null;
    }

    @Override
    public RuleOutcome apply(RuleContext ctx) {
        var e = ctx.extraction();
        LocalDate until = e.expiryDate();
        long days = ChronoUnit.DAYS.between(ctx.today(), until);

        RuleStatus status;
        if (days < 0) status = RuleStatus.EXPIRED;
        else if (days < 30) status = RuleStatus.EXPIRING_SOON;
        else status = RuleStatus.ACTIVE;

        return new RuleOutcome(
                code(),
                "Vigencia del documento",
                until,
                days,
                status,
                "Fecha de vencimiento oficial extraída del documento."
        );
    }
}
