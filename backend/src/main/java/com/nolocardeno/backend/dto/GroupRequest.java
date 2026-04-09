package com.nolocardeno.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GroupRequest {

    @NotBlank(message = "El nombre del grupo es obligatorio")
    @Size(max = 50, message = "El nombre del grupo no puede superar los 50 caracteres")
    private String name;

    private Boolean allCanAddDocuments = true;
}
