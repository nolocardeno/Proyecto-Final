package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.AuthResponse;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.UserRepository;
import com.nolocardeno.backend.repository.spec.UserSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints exclusivos para usuarios con rol {@code ADMIN}.
 *
 * <p>La autorización se aplica tanto en {@code SecurityConfig} (a nivel de
 * URL: {@code /api/admin/**} → {@code hasRole(ADMIN)}) como con
 * {@link PreAuthorize} a nivel de método (defensa en profundidad).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    /**
     * Listado paginado y filtrable de usuarios.
     *
     * <p>Ejemplos:
     * <pre>
     *   GET /api/admin/users?page=0&amp;size=10&amp;sort=email,asc
     *   GET /api/admin/users?role=ADMIN
     *   GET /api/admin/users?q=manolo
     * </pre>
     */
    @GetMapping("/users")
    public ResponseEntity<Page<AuthResponse>> listUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        Specification<User> spec = Specification.where(UserSpecifications.hasRole(role))
                .and(UserSpecifications.textMatches(q));
        Page<AuthResponse> page = userRepository.findAll(spec, pageable).map(this::toResponse);
        return ResponseEntity.ok(page);
    }

    private AuthResponse toResponse(User u) {
        return AuthResponse.builder()
                .userId(u.getId())
                .email(u.getEmail())
                .name(u.getName())
                .profileImagePath(u.getProfileImagePath())
                .role(u.getRole().name())
                .build();
    }
}
