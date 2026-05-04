package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.AuthRequest;
import com.nolocardeno.backend.dto.AuthResponse;
import com.nolocardeno.backend.dto.RegisterRequest;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.UserRepository;
import com.nolocardeno.backend.security.CustomUserDetails;
import com.nolocardeno.backend.security.JwtService;
import com.nolocardeno.backend.security.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Email o contraseña incorrectos";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe una cuenta con ese email");
        }

        User user = userRepository.save(User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getEmail().split("@")[0])
                .role(Role.USER)
                .build());

        return toResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        // Mensaje genérico idéntico para email inexistente y password inválida
        // (evita user enumeration). 401 Unauthorized vía BadCredentialsException.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException(INVALID_CREDENTIALS);
        }

        return toResponse(user);
    }

    /**
     * Revoca el JWT recibido añadiéndolo a la lista negra hasta su expiración.
     * Idempotente: si el token está vacío o no es válido, no hace nada.
     */
    public void logout(String token) {
        if (token == null || token.isBlank() || !jwtService.isValid(token)) {
            return;
        }
        long exp = jwtService.extractExpirationEpochMs(token);
        tokenBlacklistService.revoke(token, exp);
    }

    private AuthResponse toResponse(User user) {
        String token = jwtService.generateToken(new CustomUserDetails(user));
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImagePath(user.getProfileImagePath())
                .role(user.getRole().name())
                .token(token)
                .build();
    }
}
