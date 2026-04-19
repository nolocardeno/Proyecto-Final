package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.DocumentRequest;
import com.nolocardeno.backend.dto.DocumentResponse;
import com.nolocardeno.backend.dto.RenewalHistoryResponse;
import com.nolocardeno.backend.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // TODO: obtener userId del token JWT (Sprint 5). Por ahora se pasa como header temporal.

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAll(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(documentService.getDocumentsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getById(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(userId, id));
    }

    @PostMapping
    public ResponseEntity<DocumentResponse> create(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.createDocument(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentResponse> update(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.ok(documentService.updateDocument(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        documentService.deleteDocument(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<DocumentResponse> renew(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestParam LocalDate newExpiryDate) {
        return ResponseEntity.ok(documentService.renewDocument(userId, id, newExpiryDate));
    }

    @GetMapping("/{id}/renewals")
    public ResponseEntity<List<RenewalHistoryResponse>> getRenewalHistory(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(documentService.getRenewalHistory(userId, id));
    }

    @PostMapping("/check-duplicates")
    public ResponseEntity<List<DocumentResponse>> checkDuplicates(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.ok(documentService.checkDuplicates(userId, request));
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<DocumentResponse> uploadImage(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.uploadDocumentImage(userId, id, file));
    }
}
