package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.AuthResponse;
import com.nolocardeno.backend.dto.UpdateUserRequest;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks UserService service;

    private User user(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .name("Old")
                .passwordHash("hashed")
                .role(Role.USER)
                .build();
    }

    @Test
    void getUser_returns_response_when_found() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "a@b.c")));
        AuthResponse resp = service.getUser(1L);
        assertThat(resp.getEmail()).isEqualTo("a@b.c");
        assertThat(resp.getRole()).isEqualTo("USER");
    }

    @Test
    void getUser_throws_when_missing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getUser(99L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateUser_changes_name_and_email_and_password() {
        User existing = user(1L, "old@x.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.existsByEmail("new@x.com")).thenReturn(false);
        when(passwordEncoder.matches("current", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("newpass")).thenReturn("newhash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("New");
        req.setEmail("new@x.com");
        req.setCurrentPassword("current");
        req.setNewPassword("newpass");

        AuthResponse resp = service.updateUser(1L, req);

        assertThat(resp.getName()).isEqualTo("New");
        assertThat(resp.getEmail()).isEqualTo("new@x.com");
        assertThat(existing.getPasswordHash()).isEqualTo("newhash");
    }

    @Test
    void updateUser_throws_when_email_already_exists() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "old@x.com")));
        when(userRepository.existsByEmail("taken@x.com")).thenReturn(true);
        UpdateUserRequest req = new UpdateUserRequest();
        req.setEmail("taken@x.com");
        assertThatThrownBy(() -> service.updateUser(1L, req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateUser_throws_when_current_password_is_wrong() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "old@x.com")));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);
        UpdateUserRequest req = new UpdateUserRequest();
        req.setCurrentPassword("wrong");
        req.setNewPassword("new");
        assertThatThrownBy(() -> service.updateUser(1L, req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteUser_removes_user() {
        User existing = user(1L, "x@y.z");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        service.deleteUser(1L);
        verify(userRepository).delete(existing);
    }
}
