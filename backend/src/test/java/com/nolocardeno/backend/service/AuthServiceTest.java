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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock TokenBlacklistService tokenBlacklistService;

    @InjectMocks AuthService authService;

    @Test
    void register_creates_user_with_role_USER_and_returns_jwt() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@user.com");
        req.setPassword("secret");

        when(userRepository.existsByEmail("new@user.com")).thenReturn(false);
        when(passwordEncoder.encode("secret")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("jwt-token");

        AuthResponse resp = authService.register(req);

        assertThat(resp.getToken()).isEqualTo("jwt-token");
        assertThat(resp.getRole()).isEqualTo(Role.USER.name());
        assertThat(resp.getEmail()).isEqualTo("new@user.com");
    }

    @Test
    void register_throws_when_email_already_exists() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("dup@user.com");
        req.setPassword("x");
        when(userRepository.existsByEmail("dup@user.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_success_returns_token() {
        User u = User.builder()
                .id(7L).email("a@b.com").passwordHash("hash").name("A").role(Role.ADMIN).build();
        AuthRequest req = new AuthRequest();
        req.setEmail("a@b.com");
        req.setPassword("good");

        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("good", "hash")).thenReturn(true);
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("tk");

        AuthResponse resp = authService.login(req);

        assertThat(resp.getToken()).isEqualTo("tk");
        assertThat(resp.getRole()).isEqualTo("ADMIN");
        assertThat(resp.getUserId()).isEqualTo(7L);
    }

    @Test
    void login_with_unknown_email_throws_BadCredentials() {
        AuthRequest req = new AuthRequest();
        req.setEmail("ghost@x.com");
        req.setPassword("pw");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_with_wrong_password_throws_BadCredentials() {
        User u = User.builder()
                .id(1L).email("a@b.com").passwordHash("hash").name("A").role(Role.USER).build();
        AuthRequest req = new AuthRequest();
        req.setEmail("a@b.com");
        req.setPassword("bad");

        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("bad", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void logout_revokes_valid_token() {
        when(jwtService.isValid("tk")).thenReturn(true);
        when(jwtService.extractExpirationEpochMs("tk")).thenReturn(123_000L);

        authService.logout("tk");

        verify(tokenBlacklistService).revoke("tk", 123_000L);
    }

    @Test
    void logout_ignores_null_blank_or_invalid_token() {
        authService.logout(null);
        authService.logout("   ");
        when(jwtService.isValid("garbage")).thenReturn(false);
        authService.logout("garbage");
        verify(tokenBlacklistService, never()).revoke(anyString(), anyLong());
    }
}
