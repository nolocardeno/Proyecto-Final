package com.nolocardeno.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    @Test
    void allow_returns_true_until_max_then_false() {
        RateLimitFilter filter = new RateLimitFilter(60_000L, 3);

        assertThat(filter.allow("1.2.3.4")).isTrue();
        assertThat(filter.allow("1.2.3.4")).isTrue();
        assertThat(filter.allow("1.2.3.4")).isTrue();
        assertThat(filter.allow("1.2.3.4")).isFalse();
    }

    @Test
    void window_is_reset_after_time_passes() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(1L, 2);

        assertThat(filter.allow("ip")).isTrue();
        assertThat(filter.allow("ip")).isTrue();
        Thread.sleep(5);
        // New window opens again
        assertThat(filter.allow("ip")).isTrue();
    }

    @Test
    void shouldNotFilter_skips_non_auth_paths() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(60_000L, 10);
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI("/api/documents");
        // OncePerRequestFilter exposes shouldNotFilter as protected; we
        // verify behaviour indirectly via doFilter not blocking.
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(req, new MockHttpServletResponse(), chain);
        verify(chain).doFilter(any(), any());
    }

    @Test
    void doFilterInternal_returns_429_when_quota_exceeded() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(60_000L, 1);
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI("/api/auth/login");
        req.setRemoteAddr("9.9.9.9");
        FilterChain chain = mock(FilterChain.class);

        // First call passes
        MockHttpServletResponse ok = new MockHttpServletResponse();
        filter.doFilter(req, ok, chain);
        assertThat(ok.getStatus()).isEqualTo(200);

        // Second call rejected with 429
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(req, blocked, chain);
        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getContentAsString()).contains("Demasiadas peticiones");
        verify(chain, times(1)).doFilter(any(), any());
    }

    @Test
    void uses_x_forwarded_for_when_present() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(60_000L, 1);
        MockHttpServletRequest a = new MockHttpServletRequest();
        a.setRequestURI("/api/auth/register");
        a.setRemoteAddr("0.0.0.0");
        a.addHeader("X-Forwarded-For", "1.1.1.1, 2.2.2.2");

        MockHttpServletRequest b = new MockHttpServletRequest();
        b.setRequestURI("/api/auth/register");
        b.setRemoteAddr("0.0.0.0");
        b.addHeader("X-Forwarded-For", "3.3.3.3");

        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse r1 = new MockHttpServletResponse();
        MockHttpServletResponse r2 = new MockHttpServletResponse();
        filter.doFilter(a, r1, chain);
        filter.doFilter(b, r2, chain);

        assertThat(r1.getStatus()).isEqualTo(200);
        assertThat(r2.getStatus()).isEqualTo(200); // distinct IPs share quotas independently
    }
}
