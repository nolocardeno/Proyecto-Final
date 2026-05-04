package com.nolocardeno.backend.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock JwtService jwtService;
    @Mock CustomUserDetailsService userDetailsService;
    @Mock TokenBlacklistService tokenBlacklistService;
    @InjectMocks JwtAuthFilter filter;

    @AfterEach
    void clear() { SecurityContextHolder.clearContext(); }

    @Test
    void valid_token_sets_authentication() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer good-token");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        when(jwtService.isValid("good-token")).thenReturn(true);
        when(tokenBlacklistService.isRevoked("good-token")).thenReturn(false);
        when(jwtService.extractUsername("good-token")).thenReturn("u@x.com");
        when(userDetailsService.loadUserByUsername("u@x.com"))
                .thenReturn(User.withUsername("u@x.com").password("p").roles("USER").build());

        filter.doFilterInternal(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        verify(chain).doFilter(req, res);
    }

    @Test
    void revoked_token_is_rejected() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer bad-token");
        FilterChain chain = mock(FilterChain.class);

        when(jwtService.isValid("bad-token")).thenReturn(true);
        when(tokenBlacklistService.isRevoked("bad-token")).thenReturn(true);

        filter.doFilterInternal(req, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userDetailsService, never()).loadUserByUsername(any());
        verify(chain).doFilter(any(), any());
    }

    @Test
    void no_authorization_header_is_passed_through() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        filter.doFilterInternal(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(any(), any());
    }

    @Test
    void invalid_token_does_not_authenticate() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer x");
        FilterChain chain = mock(FilterChain.class);
        when(jwtService.isValid("x")).thenReturn(false);

        filter.doFilterInternal(req, new MockHttpServletResponse(), chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(any(), any());
    }
}
