package com.nolocardeno.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate-limiting in-memory aplicado a los endpoints sensibles de
 * autenticación ({@code /api/auth/login} y {@code /api/auth/register}).
 *
 * <p>Implementa una ventana fija por IP (por defecto 10 peticiones cada
 * 60 s). Cuando se excede el límite responde con
 * {@code HTTP 429 Too Many Requests} en formato JSON.
 *
 * <p>Es una protección básica frente a fuerza bruta y abuso de registro.
 * Para entornos productivos con varias instancias debería migrarse a un
 * almacenamiento compartido (Redis) o a una librería como Bucket4j.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final long windowMs;
    private final int maxRequests;
    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${scantral.security.rate-limit.window-ms:60000}") long windowMs,
            @Value("${scantral.security.rate-limit.max-requests:10}") int maxRequests) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register"));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String key = clientIp(request);
        if (!allow(key)) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiadas peticiones, inténtalo en unos segundos\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    /** Visible para tests: comprueba si hay cuota disponible para {@code key}. */
    boolean allow(String key) {
        long now = System.currentTimeMillis();
        Window window = buckets.compute(key, (k, current) -> {
            if (current == null || (now - current.start) >= windowMs) {
                return new Window(now);
            }
            return current;
        });
        return window.count.incrementAndGet() <= maxRequests;
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Window {
        final long start;
        final AtomicInteger count = new AtomicInteger(0);
        Window(long start) { this.start = start; }
    }
}
