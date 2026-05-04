package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.DocumentAlertRequest;
import com.nolocardeno.backend.dto.DocumentAlertResponse;
import com.nolocardeno.backend.security.CustomUserDetails;
import com.nolocardeno.backend.service.DocumentAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents/{documentId}/alerts")
@RequiredArgsConstructor
public class DocumentAlertController {

    private final DocumentAlertService alertService;

    @GetMapping
    public ResponseEntity<List<DocumentAlertResponse>> getAlerts(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long documentId) {
        return ResponseEntity.ok(alertService.getAlerts(principal.getId(), documentId));
    }

    @PostMapping
    public ResponseEntity<DocumentAlertResponse> createAlert(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long documentId,
            @Valid @RequestBody DocumentAlertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(alertService.createAlert(principal.getId(), documentId, request));
    }

    @DeleteMapping("/{alertId}")
    public ResponseEntity<Void> deleteAlert(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long documentId,
            @PathVariable Long alertId) {
        alertService.deleteAlert(principal.getId(), documentId, alertId);
        return ResponseEntity.noContent().build();
    }
}
