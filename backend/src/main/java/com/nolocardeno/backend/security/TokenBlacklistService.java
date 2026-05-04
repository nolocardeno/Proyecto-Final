package com.nolocardeno.backend.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lista negra de JWT en memoria.
 *
 * <p>Cuando un usuario hace logout, su token se almacena aquí junto a su
 * fecha de expiración. {@link JwtAuthFilter} consulta esta lista en cada
 * petición autenticada y rechaza los tokens revocados aunque la firma siga
 * siendo válida.
 *
 * <p>Implementación intencionadamente sencilla: estructura de datos en
 * memoria con autolimpieza perezosa de las entradas ya caducadas. Para
 * clústeres de varias instancias debería sustituirse por Redis o similar.
 */
@Service
public class TokenBlacklistService {

    private final Map<String, Long> revoked = new ConcurrentHashMap<>();

    /** Marca el token como revocado hasta su fecha de expiración. */
    public void revoke(String token, long expirationEpochMs) {
        if (token == null || token.isBlank()) {
            return;
        }
        revoked.put(token, expirationEpochMs);
        purgeExpired();
    }

    /** {@code true} si el token aparece en la lista negra (y aún no expiró). */
    public boolean isRevoked(String token) {
        if (token == null) {
            return false;
        }
        Long exp = revoked.get(token);
        if (exp == null) {
            return false;
        }
        if (exp <= Instant.now().toEpochMilli()) {
            revoked.remove(token);
            return false;
        }
        return true;
    }

    /** Visible para tests. */
    int size() {
        return revoked.size();
    }

    private void purgeExpired() {
        long now = Instant.now().toEpochMilli();
        revoked.entrySet().removeIf(e -> e.getValue() <= now);
    }
}
