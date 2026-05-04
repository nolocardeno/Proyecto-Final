package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.DocumentHistoryResponse;
import com.nolocardeno.backend.dto.DocumentRequest;
import com.nolocardeno.backend.dto.DocumentResponse;
import com.nolocardeno.backend.dto.RenewalHistoryResponse;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import com.nolocardeno.backend.security.CustomUserDetails;
import com.nolocardeno.backend.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAll(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(documentService.getDocumentsByUser(principal.getId()));
    }

    /**
     * Búsqueda paginada con filtros opcionales.
     *
     * <p>Ejemplos:
     * <pre>
     *   GET /api/documents/search?page=0&size=20&sort=expiryDate,asc
     *   GET /api/documents/search?status=EXPIRING_SOON&type=DNI
     *   GET /api/documents/search?q=carrefour
     * </pre>
     */
    @GetMapping("/search")
    public ResponseEntity<Page<DocumentResponse>> search(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) DocumentStatus status,
            @RequestParam(required = false) DocumentType type,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
                documentService.searchDocuments(principal.getId(), status, type, q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getById(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(principal.getId(), id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> create(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestPart("data") @Valid DocumentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.createDocument(principal.getId(), request, file));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> update(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id,
            @RequestPart("data") @Valid DocumentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(documentService.updateDocument(principal.getId(), id, request, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        documentService.deleteDocument(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<DocumentResponse> renew(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id,
            @RequestParam LocalDate newExpiryDate) {
        return ResponseEntity.ok(documentService.renewDocument(principal.getId(), id, newExpiryDate));
    }

    @GetMapping("/{id}/renewals")
    public ResponseEntity<List<RenewalHistoryResponse>> getRenewalHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(documentService.getRenewalHistory(principal.getId(), id));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<DocumentHistoryResponse>> getHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentHistory(principal.getId(), id));
    }

    @PostMapping("/check-duplicates")
    public ResponseEntity<List<DocumentResponse>> checkDuplicates(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.ok(documentService.checkDuplicates(principal.getId(), request));
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<DocumentResponse> uploadImage(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.uploadDocumentImage(principal.getId(), id, file));
    }

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> extractFromImage(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "useAi", defaultValue = "false") boolean useAi) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.createFromImage(principal.getId(), file, null, useAi));
    }
}
