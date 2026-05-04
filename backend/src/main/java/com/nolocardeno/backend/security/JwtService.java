package com.nolocardeno.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

/**
 * Servicio responsable de emitir y validar JSON Web Tokens (HS256).
 *
 * <ul>
 *   <li>Subject = email del usuario</li>
 *   <li>Claim {@code uid} = id numérico del usuario</li>
 *   <li>Claim {@code role} = rol (USER / ADMIN)</li>
 * </ul>
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${scantral.security.jwt.secret}") String secret,
                      @Value("${scantral.security.jwt.expiration-ms:86400000}") long expirationMs) {
        // Acepta tanto secret en claro (>= 32 bytes UTF-8) como base64
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
            if (keyBytes.length < 32) {
                keyBytes = secret.getBytes();
            }
        } catch (RuntimeException ex) {
            // No era base64 válido (p.ej. caracteres '-' o '_'): tratamos el
            // valor como UTF-8 plano. Debe tener >= 32 bytes para HS256.
            keyBytes = secret.getBytes();
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(CustomUserDetails principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.getUsername())
                .claims(Map.of(
                        "uid", principal.getId(),
                        "role", principal.getUser().getRole().name()
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    /** Devuelve la expiración del token en milisegundos epoch. */
    public long extractExpirationEpochMs(String token) {
        return parse(token).getExpiration().getTime();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
