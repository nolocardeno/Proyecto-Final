package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.DocumentRequest;
import com.nolocardeno.backend.dto.DocumentResponse;
import com.nolocardeno.backend.dto.GroupDetailResponse;
import com.nolocardeno.backend.dto.GroupRequest;
import com.nolocardeno.backend.dto.GroupResponse;
import com.nolocardeno.backend.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getAll(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(groupService.getGroupsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroup(userId, id));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<GroupDetailResponse> getDetail(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupDetail(userId, id));
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<List<DocumentResponse>> getDocuments(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupDocuments(userId, id));
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> addDocument(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestPart("data") @Valid DocumentRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.addDocumentToGroup(userId, id, request, file));
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody GroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.createGroup(userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        groupService.deleteGroup(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/join")
    public ResponseEntity<GroupResponse> join(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> body) {
        String accessCode = body.get("accessCode");
        return ResponseEntity.ok(groupService.joinGroup(userId, accessCode));
    }
}
