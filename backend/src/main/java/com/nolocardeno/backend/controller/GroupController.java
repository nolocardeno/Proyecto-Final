package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.DocumentRequest;
import com.nolocardeno.backend.dto.DocumentResponse;
import com.nolocardeno.backend.dto.GroupDetailResponse;
import com.nolocardeno.backend.dto.GroupRequest;
import com.nolocardeno.backend.dto.GroupResponse;
import com.nolocardeno.backend.security.CustomUserDetails;
import com.nolocardeno.backend.service.DocumentService;
import com.nolocardeno.backend.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getAll(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(groupService.getGroupsByUser(principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroup(principal.getId(), id));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<GroupDetailResponse> getDetail(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupDetail(principal.getId(), id));
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<List<DocumentResponse>> getDocuments(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupDocuments(principal.getId(), id));
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> addDocument(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id,
            @RequestPart("data") @Valid DocumentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.addDocumentToGroup(principal.getId(), id, request, file));
    }

    @PostMapping(value = "/{id}/documents/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> extractDocumentFromImage(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "useAi", defaultValue = "false") boolean useAi) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.createFromImage(principal.getId(), file, id, useAi));
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody GroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.createGroup(principal.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        groupService.deleteGroup(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/join")
    public ResponseEntity<GroupResponse> join(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody Map<String, String> body) {
        String accessCode = body.get("accessCode");
        return ResponseEntity.ok(groupService.joinGroup(principal.getId(), accessCode));
    }
}
