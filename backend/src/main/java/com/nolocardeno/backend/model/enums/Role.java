package com.nolocardeno.backend.model.enums;

/**
 * Roles de la aplicación.
 *
 * Mapeo a authorities de Spring Security:
 *   USER  -> ROLE_USER
 *   ADMIN -> ROLE_ADMIN
 */
public enum Role {
    USER,
    ADMIN
}
