package com.nolocardeno.backend.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class JsonAuthErrorHandlerTest {

    private final JsonAuthErrorHandler handler = new JsonAuthErrorHandler();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void commence_writes_401_json() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.commence(new MockHttpServletRequest(), response, new BadCredentialsException("nope"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json");
        JsonNode body = mapper.readTree(response.getContentAsString());
        assertThat(body.get("status").asInt()).isEqualTo(401);
        assertThat(body.get("error").asText()).contains("Autenticación");
    }

    @Test
    void handle_writes_403_json() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.handle(new MockHttpServletRequest(), response, new AccessDeniedException("forbidden"));

        assertThat(response.getStatus()).isEqualTo(403);
        JsonNode body = mapper.readTree(response.getContentAsString());
        assertThat(body.get("status").asInt()).isEqualTo(403);
        assertThat(body.get("error").asText()).contains("permisos");
    }
}
