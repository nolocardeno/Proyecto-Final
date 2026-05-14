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
            "image/heif"
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

        byte[] head;
        try (InputStream in = file.getInputStream()) {
            head = in.readNBytes(12);
        } catch (IOException e) {
            throw new IllegalArgumentException("No se puede leer el archivo");
        }

        String mime = file.getContentType();
        // Some browsers (Safari/iOS) report HEIF and other images as
        // application/octet-stream. Sniff the real type from the magic bytes
        // so these uploads are not rejected unfairly.
        if (mime == null || mime.equalsIgnoreCase("application/octet-stream")) {
            mime = sniffMimeFromMagic(head);
        }
        mime = mime.toLowerCase();

        if (!ALLOWED_MIMES.contains(mime)) {
            throw new IllegalArgumentException("Tipo MIME no permitido: " + file.getContentType());
        }
        if (!matchesMagic(head, mime)) {
            throw new IllegalArgumentException("El contenido del archivo no coincide con su tipo declarado");
        }
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
        return "application/octet-stream";
    }

    private boolean matchesMagic(byte[] head, String mime) {
        if (head == null || head.length < 4) return false;
        return switch (mime) {
            case "image/jpeg" -> (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8;
            case "image/png"  -> (head[0] & 0xFF) == 0x89 && head[1] == 0x50 && head[2] == 0x4E && head[3] == 0x47;
            case "image/webp" -> head[0] == 0x52 && head[1] == 0x49 && head[2] == 0x46 && head[3] == 0x46
                                 && head.length >= 12
                                 && head[8] == 0x57 && head[9] == 0x45 && head[10] == 0x42 && head[11] == 0x50;
            // HEIF/HEIC: ISO Base Media File Format — ftyp box at bytes 4-7,
            // brand at bytes 8-11 (heic, heis, hevc, mif1, msf1, …).
            case "image/heic", "image/heif" -> head.length >= 12
                                 && head[4] == 0x66 && head[5] == 0x74 && head[6] == 0x79 && head[7] == 0x70;
            default -> false;
        };
    }
}
