package com.nolocardeno.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentAlertResponse {

    private Long id;
    private Long documentId;
    private Integer daysBeforeExpiry;
    private LocalDateTime notifiedAt;
    private LocalDateTime createdAt;
}
