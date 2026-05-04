package com.nolocardeno.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class AuthResponse {

    private Long userId;
    private String email;
    private String name;
    private String profileImagePath;
    private String role;
    private String token;
}
