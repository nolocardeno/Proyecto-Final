package com.nolocardeno.backend.dto;

import com.nolocardeno.backend.model.enums.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentRequest {

    @NotNull(message = "El tipo de documento es obligatorio")
    private DocumentType type;

    private String kind;

    @NotBlank(message = "El título es obligatorio")
    private String title;

    private String category;

    private String storeName;

    private BigDecimal amount;

    private LocalDate issueDate;

    private LocalDate expiryDate;

    private String notes;
}
