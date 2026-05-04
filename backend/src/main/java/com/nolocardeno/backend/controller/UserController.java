package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.AuthResponse;
import com.nolocardeno.backend.dto.UpdateUserRequest;
import com.nolocardeno.backend.security.CustomUserDetails;
import com.nolocardeno.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLConnection;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<AuthResponse> getUser(@PathVariable Long userId,
                                                @AuthenticationPrincipal CustomUserDetails principal) {
        ensureSelfOrAdmin(principal, userId);
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @GetMapping("/{userId}/profile-image")
    public ResponseEntity<Resource> getProfileImage(@PathVariable Long userId) throws IOException {
        // Pública porque las imágenes se piden con <img src> sin headers Authorization.
        Resource resource = userService.getProfileImageResource(userId);
        String contentType = URLConnection.guessContentTypeFromName(resource.getFilename());
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(resource);
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<AuthResponse> updateUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateUserRequest request) {
        ensureSelfOrAdmin(principal, userId);
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @PostMapping(value = "/{userId}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponse> uploadProfileImage(
            @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam("file") MultipartFile file) throws Exception {
        ensureSelfOrAdmin(principal, userId);
        return ResponseEntity.ok(userService.uploadProfileImage(userId, file));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId,
                                           @AuthenticationPrincipal CustomUserDetails principal) {
        ensureSelfOrAdmin(principal, userId);
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    /** El usuario sólo puede operar sobre su propia cuenta; ADMIN puede operar sobre cualquiera. */
    private void ensureSelfOrAdmin(CustomUserDetails principal, Long targetUserId) {
        if (principal == null) {
            throw new AccessDeniedException("No autenticado");
        }
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin && !principal.getId().equals(targetUserId)) {
            throw new AccessDeniedException("No puedes operar sobre otro usuario");
        }
    }
}
