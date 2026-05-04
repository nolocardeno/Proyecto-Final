package com.nolocardeno.backend.security;

/**
 * Pequeña utilidad para evitar repetir {@code principal.getId()} y mejorar
 * la legibilidad de los controladores.
 */
public final class AuthUtils {

    private AuthUtils() {}

    public static Long currentUserId(CustomUserDetails principal) {
        if (principal == null) {
            throw new IllegalStateException("No hay usuario autenticado");
        }
        return principal.getId();
    }
}
