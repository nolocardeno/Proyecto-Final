package com.nolocardeno.backend.security;

import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CustomUserDetailsAndAuthUtilsTest {

    @Test
    void custom_user_details_exposes_user_fields() {
        User u = User.builder()
                .id(7L)
                .email("u@x.com")
                .passwordHash("hash")
                .role(Role.ADMIN)
                .build();
        CustomUserDetails details = new CustomUserDetails(u);

        assertThat(details.getId()).isEqualTo(7L);
        assertThat(details.getUsername()).isEqualTo("u@x.com");
        assertThat(details.getPassword()).isEqualTo("hash");
        assertThat(details.isAccountNonExpired()).isTrue();
        assertThat(details.isAccountNonLocked()).isTrue();
        assertThat(details.isCredentialsNonExpired()).isTrue();
        assertThat(details.isEnabled()).isTrue();
        assertThat(details.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_ADMIN");
    }

    @Test
    void auth_utils_returns_user_id() {
        User u = User.builder().id(42L).email("x@y.z").role(Role.USER).build();
        assertThat(AuthUtils.currentUserId(new CustomUserDetails(u))).isEqualTo(42L);
    }

    @Test
    void auth_utils_throws_when_principal_is_null() {
        assertThatThrownBy(() -> AuthUtils.currentUserId(null))
                .isInstanceOf(IllegalStateException.class);
    }
}
