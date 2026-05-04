package com.nolocardeno.backend.security;

import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        // Secreto >= 32 bytes para HS256
        jwtService = new JwtService(
                "test-only-secret-key-with-32-bytes-minimum-please-1234567890",
                3_600_000L
        );
        user = User.builder()
                .id(42L)
                .email("alice@example.com")
                .passwordHash("x")
                .name("Alice")
                .role(Role.ADMIN)
                .build();
    }

    @Test
    void generates_a_valid_token_for_a_user() {
        String token = jwtService.generateToken(new CustomUserDetails(user));

        assertThat(token).isNotBlank();
        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice@example.com");
    }

    @Test
    void rejects_a_tampered_token() {
        String token = jwtService.generateToken(new CustomUserDetails(user));
        String tampered = token.substring(0, token.length() - 2) + "AB";

        assertThat(jwtService.isValid(tampered)).isFalse();
    }

    @Test
    void rejects_garbage_input() {
        assertThat(jwtService.isValid("not-a-jwt")).isFalse();
        assertThat(jwtService.isValid("")).isFalse();
    }

    @Test
    void extractExpirationEpochMs_returns_future_timestamp() {
        long beforeMs = System.currentTimeMillis();
        String token = jwtService.generateToken(new CustomUserDetails(user));
        long exp = jwtService.extractExpirationEpochMs(token);
        // Expira en ~1h ± unos pocos segundos
        assertThat(exp).isGreaterThan(beforeMs);
        assertThat(exp).isLessThanOrEqualTo(beforeMs + 3_600_000L + 5_000L);
    }
}
