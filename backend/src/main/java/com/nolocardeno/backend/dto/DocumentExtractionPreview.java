package com.nolocardeno.backend.dto;

import com.nolocardeno.backend.model.enums.DocumentType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Resultado de una extracción OCR/IA sin persistir todavía el documento.
 *
 * Se devuelve al frontend para que rellene el formulario manual con los
 * datos detectados y el usuario pueda revisarlos/confirmarlos antes de
 * crear el documento definitivamente.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentExtractionPreview {

    /** Tipo detectado (DNI, RECEIPT, ...). */
    private DocumentType type;

    /** "ticket" o "document" según el tipo detectado. */
    private String kind;

    private String title;
    private String category;
    private String storeName;
    private BigDecimal amount;
    private LocalDate issueDate;
    private LocalDate expiryDate;

    /** True si la extracción la hizo el motor de IA (Gemini); false si fue el OCR local. */
    private Boolean aiProcessed;
}
