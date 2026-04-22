package com.nolocardeno.backend.dto;

import com.nolocardeno.backend.model.enums.DocumentHistoryType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentHistoryResponse {

    private Long id;
    private Long documentId;
    private DocumentHistoryType changeType;
    private String description;
    private String changedByName;
    private LocalDateTime changedAt;
}
