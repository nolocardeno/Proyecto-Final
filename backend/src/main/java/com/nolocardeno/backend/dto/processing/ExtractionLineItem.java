package com.nolocardeno.backend.dto.processing;

import java.math.BigDecimal;

public record ExtractionLineItem(
        String description,
        BigDecimal price,
        Integer qty,
        String category
) {
}
