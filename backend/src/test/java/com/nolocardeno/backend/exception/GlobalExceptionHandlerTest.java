package com.nolocardeno.backend.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.lang.reflect.Method;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void notFound_returns_404() {
        ResponseEntity<Map<String, Object>> resp = handler.handleNotFound(
                new ResourceNotFoundException("missing"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(resp.getBody()).containsEntry("error", "missing");
    }

    @Test
    void illegalArgument_returns_400() {
        ResponseEntity<Map<String, Object>> resp = handler.handleIllegalArgument(
                new IllegalArgumentException("bad"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void badCredentials_returns_401() {
        ResponseEntity<Map<String, Object>> resp = handler.handleBadCredentials(
                new BadCredentialsException("nope"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void authentication_returns_401() {
        ResponseEntity<Map<String, Object>> resp = handler.handleAuthentication(
                new AuthenticationException("nope") {});
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void accessDenied_returns_403() {
        ResponseEntity<Map<String, Object>> resp = handler.handleAccessDenied(
                new AccessDeniedException("nope"));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void uploadSize_returns_413() {
        ResponseEntity<Map<String, Object>> resp = handler.handleUploadSize(
                new MaxUploadSizeExceededException(1024L));
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONTENT_TOO_LARGE);
    }

    @Test
    void validation_returns_400_with_field_errors() throws Exception {
        BeanPropertyBindingResult br = new BeanPropertyBindingResult(new Object(), "obj");
        br.addError(new FieldError("obj", "email", "must not be blank"));
        // MethodArgumentNotValidException requires a MethodParameter; use a
        // dummy method via reflection.
        Method m = Sample.class.getDeclaredMethod("noop", String.class);
        org.springframework.core.MethodParameter mp = new org.springframework.core.MethodParameter(m, 0);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(mp, br);

        ResponseEntity<Map<String, Object>> resp = handler.handleValidation(ex);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        @SuppressWarnings("unchecked")
        Map<String, String> errors = (Map<String, String>) resp.getBody().get("errors");
        assertThat(errors).containsEntry("email", "must not be blank");
    }

    @SuppressWarnings("unused")
    private static class Sample {
        void noop(String s) {}
    }
}
