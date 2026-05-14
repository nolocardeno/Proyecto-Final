package com.nolocardeno.backend.dto;

import com.nolocardeno.backend.model.enums.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @Size(max = 50, message = "El tipo de documento no puede superar 50 caracteres")
    private String kind;

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 100, message = "El título no puede superar 100 caracteres")
    private String title;

    @Size(max = 50, message = "La categoría no puede superar 50 caracteres")
    private String category;

    @Size(max = 100, message = "El nombre de tienda no puede superar 100 caracteres")
    private String storeName;

    private BigDecimal amount;

    private LocalDate issueDate;

    private LocalDate expiryDate;

    @Size(max = 2000, message = "Las notas no pueden superar 2000 caracteres")
    private String notes;

    /**
     * Indica si el documento fue creado a partir de datos extraídos mediante
     * OCR/IA. El cliente puede establecerlo a {@code true} cuando confirma
     * manualmente un preview generado por la IA, de modo que la marca
     * persista en el documento creado.
     */
    private Boolean aiProcessed;

    /**
     * Método con el que se originó el documento. Valores reconocidos:
     * {@code "MANUAL"}, {@code "OCR"}, {@code "AI"}.
     * Si no se informa se asume {@code "MANUAL"}.
     */
    private String creationMethod;
}
