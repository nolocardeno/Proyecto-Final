package com.nolocardeno.backend.service.processing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

/**
 * Validates uploaded files beyond the basic Spring multipart limits:
 *  - MIME allowlist
 *  - size limit
 *  - magic-byte check to detect spoofed MIME types
 *
 * Protects against OWASP A03/A08 (malicious file upload, broken integrity).
 */
@Service
public class DocumentFileValidator {

    private static final Set<String> ALLOWED_MIMES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final long maxSizeBytes;

    public DocumentFileValidator(
            @Value("${scantral.processing.max-file-size:10485760}") long maxSizeBytes
    ) {
        this.maxSizeBytes = maxSizeBytes;
    }

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo permitido");
        }
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_MIMES.contains(mime.toLowerCase())) {
            throw new IllegalArgumentException("Tipo MIME no permitido: " + mime);
        }

        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(12);
            if (!matchesMagic(head, mime)) {
                throw new IllegalArgumentException("El contenido del archivo no coincide con su tipo declarado");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("No se puede leer el archivo");
        }
    }

    private boolean matchesMagic(byte[] head, String mime) {
        if (head == null || head.length < 4) return false;
        return switch (mime) {
            case "image/jpeg" -> (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8;
            case "image/png"  -> (head[0] & 0xFF) == 0x89 && head[1] == 0x50 && head[2] == 0x4E && head[3] == 0x47;
            case "image/webp" -> head[0] == 0x52 && head[1] == 0x49 && head[2] == 0x46 && head[3] == 0x46
                                 && head.length >= 12
                                 && head[8] == 0x57 && head[9] == 0x45 && head[10] == 0x42 && head[11] == 0x50;
            default -> false;
        };
    }
}
