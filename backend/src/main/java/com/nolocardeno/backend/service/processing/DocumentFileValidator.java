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
            "image/webp",
            "image/heic",
            "image/heif",
            "application/pdf"
    );

    private final long maxSizeBytes;

    public DocumentFileValidator(
            @Value("${scantral.processing.max-file-size:10485760}") long maxSizeBytes
    ) {
        this.maxSizeBytes = maxSizeBytes;
    }

    /**
     * Validates the file and returns its effective MIME type derived from
     * magic bytes. Callers should use the returned value instead of
     * {@code file.getContentType()} because Safari/iOS frequently misreports
     * HEIC images as {@code image/jpeg} or {@code application/octet-stream}.
     */
    public String validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo permitido");
        }

        byte[] head;
        try (InputStream in = file.getInputStream()) {
            head = in.readNBytes(12);
        } catch (IOException e) {
            throw new IllegalArgumentException("No se puede leer el archivo");
        }

        // Use magic bytes as the authoritative format. Safari/iOS frequently
        // misreports HEIC files as image/jpeg or application/octet-stream, so
        // trusting the browser-declared MIME is not reliable.
        String effectiveMime = sniffMimeFromMagic(head);

        if (!ALLOWED_MIMES.contains(effectiveMime)) {
            throw new IllegalArgumentException("Tipo MIME no permitido: " + file.getContentType());
        }
        return effectiveMime;
    }

    /**
     * Derives a MIME type from the first bytes of the file content.
     * Returns "application/octet-stream" if no known signature is found.
     */
    private String sniffMimeFromMagic(byte[] head) {
        if (head == null || head.length < 4) return "application/octet-stream";
        // JPEG: FF D8
        if ((head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8) return "image/jpeg";
        // PNG: 89 50 4E 47
        if ((head[0] & 0xFF) == 0x89 && head[1] == 0x50 && head[2] == 0x4E && head[3] == 0x47) return "image/png";
        // WEBP: RIFF....WEBP
        if (head[0] == 0x52 && head[1] == 0x49 && head[2] == 0x46 && head[3] == 0x46
                && head.length >= 12
                && head[8] == 0x57 && head[9] == 0x45 && head[10] == 0x42 && head[11] == 0x50) return "image/webp";
        // HEIF/HEIC: ISO Base Media ftyp box at bytes 4-7
        if (head.length >= 12
                && head[4] == 0x66 && head[5] == 0x74 && head[6] == 0x79 && head[7] == 0x70) return "image/heic";
        // PDF: %PDF = 25 50 44 46
        if ((head[0] & 0xFF) == 0x25 && head[1] == 0x50 && head[2] == 0x44 && head[3] == 0x46) return "application/pdf";
        return "application/octet-stream";
    }
}
