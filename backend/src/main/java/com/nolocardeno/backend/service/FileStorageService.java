package com.nolocardeno.backend.service;

import com.nolocardeno.backend.service.processing.PdfPageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif");

    private final Path uploadDir;
    private final PdfPageConverter pdfConverter;

    public FileStorageService(
            @Value("${scantral.uploads.path:./uploads}") String uploadsPath,
            PdfPageConverter pdfConverter
    ) throws IOException {
        this.uploadDir = Paths.get(uploadsPath).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
        this.pdfConverter = pdfConverter;
    }

    /**
     * Stores a user-uploaded image file, automatically converting PDFs to PNG.
     * Use this method for all user-facing image uploads instead of {@link #store}.
     */
    public String storeConvertingPdf(MultipartFile file) throws IOException {
        if (isPdfFile(file)) {
            byte[] pngBytes = pdfConverter.firstPageAsPng(file.getBytes());
            return storeBytes(pngBytes, ".png");
        }
        return store(file);
    }

    /**
     * Stores a multipart file in the uploads directory and returns its public URL path.
     */
    public String store(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = resolveExtension(originalFilename, file.getContentType());

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido: " + extension);
        }

        String fileName = UUID.randomUUID().toString() + extension;
        Path targetPath = this.uploadDir.resolve(fileName).normalize();

        // Prevent path traversal
        if (!targetPath.startsWith(this.uploadDir)) {
            throw new IllegalArgumentException("Ruta de archivo inválida");
        }

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + fileName;
    }

    /**
     * Stores raw bytes in the uploads directory with a given extension.
     * Used when the original file has already been transformed (e.g. PDF → PNG).
     */
    public String storeBytes(byte[] bytes, String extension) throws IOException {
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido: " + extension);
        }

        String fileName = UUID.randomUUID().toString() + extension;
        Path targetPath = this.uploadDir.resolve(fileName).normalize();

        // Prevent path traversal
        if (!targetPath.startsWith(this.uploadDir)) {
            throw new IllegalArgumentException("Ruta de archivo inválida");
        }

        Files.write(targetPath, bytes);
        return "/uploads/" + fileName;
    }

    /**
     * Deletes a previously stored file by its public URL path.
     */
    public void delete(String urlPath) {
        if (urlPath == null || !urlPath.startsWith("/uploads/")) return;
        String fileName = urlPath.substring("/uploads/".length());
        try {
            Path filePath = this.uploadDir.resolve(fileName).normalize();
            if (filePath.startsWith(this.uploadDir)) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ignored) {
        }
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        if (contentType != null) {
            return switch (contentType) {
                case "image/jpeg" -> ".jpg";
                case "image/png"  -> ".png";
                case "image/webp" -> ".webp";
                case "image/gif"  -> ".gif";
                case "image/heic" -> ".heic";
                case "image/heif" -> ".heif";
                default           -> ".bin";
            };
        }
        return ".bin";
    }

    private boolean isPdfFile(MultipartFile file) {
        if ("application/pdf".equals(file.getContentType())) return true;
        String name = file.getOriginalFilename();
        return name != null && name.toLowerCase().endsWith(".pdf");
    }
}
