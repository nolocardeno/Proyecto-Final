package com.nolocardeno.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewalHistoryResponse {

    private Long id;
    private Long documentId;
    private LocalDate previousExpiryDate;
    private LocalDate newExpiryDate;
    private LocalDateTime renewedAt;
    private String notes;
}
