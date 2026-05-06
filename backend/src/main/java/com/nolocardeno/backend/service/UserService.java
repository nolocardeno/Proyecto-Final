package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.AuthResponse;
import com.nolocardeno.backend.dto.UpdateUserRequest;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentGroup;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.repository.GroupRepository;
import com.nolocardeno.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${scantral.uploads.path}")
    private String uploadsPath;

    public AuthResponse getUser(Long userId) {
        User user = findUserById(userId);
        return toResponse(user);
    }

    public AuthResponse updateUser(Long userId, UpdateUserRequest request) {
        User user = findUserById(userId);

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!request.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Ya existe una cuenta con ese email");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null ||
                    !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("La contraseña actual no es correcta");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(user);
        return toResponse(user);
    }

    public AuthResponse uploadProfileImage(Long userId, MultipartFile file) throws IOException {
        User user = findUserById(userId);

        Path uploadDir = Paths.get(uploadsPath, "profiles");
        Files.createDirectories(uploadDir);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = userId + "_" + UUID.randomUUID() + extension;
        Path filePath = uploadDir.resolve(filename);

        // Eliminar imagen anterior si existe
        if (user.getProfileImagePath() != null) {
            Path oldFile = Paths.get(uploadsPath).resolve(user.getProfileImagePath());
            Files.deleteIfExists(oldFile);
        }

        Files.copy(file.getInputStream(), filePath);

        String relativePath = "profiles/" + filename;
        user.setProfileImagePath(relativePath);
        userRepository.save(user);

        return toResponse(user);
    }

    public Resource getProfileImageResource(Long userId) throws IOException {
        User user = findUserById(userId);

        if (user.getProfileImagePath() == null) {
            throw new ResourceNotFoundException("El usuario no tiene imagen de perfil");
        }

        Path imagePath = Paths.get(uploadsPath).resolve(user.getProfileImagePath()).normalize();
        Resource resource = new UrlResource(imagePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("No se pudo leer la imagen de perfil");
        }

        return resource;
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findUserById(userId);

        // Eliminar imagen de perfil del disco
        if (user.getProfileImagePath() != null) {
            try {
                Path imagePath = Paths.get(uploadsPath).resolve(user.getProfileImagePath());
                Files.deleteIfExists(imagePath);
            } catch (IOException ignored) {
                // No bloquear la eliminación de cuenta por un fallo al borrar el archivo
            }
        }

        // Eliminar grupos de los que el usuario es creador
        List<DocumentGroup> createdGroups = groupRepository.findByCreatorIdOrderByCreatedAtDesc(userId);
        groupRepository.deleteAll(createdGroups);

        // Eliminar al usuario de los grupos en los que es miembro
        List<DocumentGroup> memberGroups = groupRepository.findByMembersIdOrderByCreatedAtDesc(userId);
        for (DocumentGroup group : memberGroups) {
            group.getMembers().remove(user);
            groupRepository.save(group);
        }

        // Eliminar los documentos del usuario de todas las tablas group_documents
        for (Document document : user.getDocuments()) {
            groupRepository.removeDocumentFromAllGroups(document.getId());
        }

        // Eliminar el usuario (cascade elimina documentos, alertas e historial)
        userRepository.delete(user);
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private AuthResponse toResponse(User user) {
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImagePath(user.getProfileImagePath())
                .role(user.getRole().name())
                .build();
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
