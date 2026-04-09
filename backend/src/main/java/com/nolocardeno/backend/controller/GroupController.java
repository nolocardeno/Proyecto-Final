package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.GroupRequest;
import com.nolocardeno.backend.dto.GroupResponse;
import com.nolocardeno.backend.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
