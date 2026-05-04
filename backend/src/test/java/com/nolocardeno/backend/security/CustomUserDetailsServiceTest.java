package com.nolocardeno.backend.security;

import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks CustomUserDetailsService service;

    @Test
    void loadByUsername_returns_user_details_when_found() {
        User u = User.builder().id(1L).email("a@b.c").passwordHash("h").role(Role.USER).build();
        when(userRepository.findByEmail("a@b.c")).thenReturn(Optional.of(u));

        UserDetails details = service.loadUserByUsername("a@b.c");

        assertThat(details).isInstanceOf(CustomUserDetails.class);
        assertThat(details.getUsername()).isEqualTo("a@b.c");
        assertThat(details.getAuthorities()).extracting(Object::toString).contains("ROLE_USER");
    }

    @Test
    void loadByUsername_throws_when_not_found() {
        when(userRepository.findByEmail("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.loadUserByUsername("missing"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
