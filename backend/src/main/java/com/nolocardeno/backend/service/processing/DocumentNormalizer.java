package com.nolocardeno.backend.service.processing;

import com.nolocardeno.backend.dto.processing.ExtractionResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Locale;

/**
 * Cleans up raw extraction output before it is fed to the rules engine:
 *  - uppercases merchant
 *  - normalizes currency code
 *  - rounds amounts to 2 decimals
 *  - drops obviously invalid expiry dates (expiry &lt; issue)
 */
@Service
public class DocumentNormalizer {

    public ExtractionResult normalize(ExtractionResult r) {
        if (r == null) return null;

        String merchant = r.merchant() == null ? null : r.merchant().trim().toUpperCase(Locale.ROOT);
        String currency = r.currency() == null ? null : r.currency().trim().toUpperCase(Locale.ROOT);

        BigDecimal amount = r.totalAmount();
        if (amount != null) {
            amount = amount.setScale(2, RoundingMode.HALF_UP);
        }

        LocalDate issue = r.issueDate();
        LocalDate expiry = r.expiryDate();
        if (issue != null && expiry != null && expiry.isBefore(issue)) {
            expiry = null;
        }

        return new ExtractionResult(
                r.status(),
                r.source(),
                r.detectedType(),
                issue,
                expiry,
                merchant,
                amount,
                currency,
                r.items(),
                r.confidences(),
                r.overallConfidence(),
                r.rawText(),
                r.holderName(),
                r.receiptCategory()
        );
    }
}
