package com.nolocardeno.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class EmailConfig {

    /**
     * Cliente HTTP preconfigurado para la API de Resend.
     * Usa HTTPS (puerto 443), por lo que no requiere ningún puerto SMTP abierto.
     */
    @Bean
    public RestClient resendRestClient(@Value("${scantral.resend.api-key}") String apiKey) {
        return RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }
}
