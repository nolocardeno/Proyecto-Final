package com.nolocardeno.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DocumentAlertRequest {

    @NotNull(message = "El número de días es obligatorio")
    @Min(value = 1, message = "El mínimo es 1 día de anticipación")
    private Integer daysBeforeExpiry;
}
