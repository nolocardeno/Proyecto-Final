package com.nolocardeno.backend.service.processing;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Converts the first page of a PDF document to a PNG image.
 *
 * Used by {@link DocumentProcessingPipeline} to normalize PDF uploads
 * into images before sending to the OCR/AI extraction pipeline.
 */
@Service
public class PdfPageConverter {

    /** Rendering resolution in DPI — 150 DPI is enough for OCR accuracy. */
    private static final float RENDER_DPI = 150f;

    /**
     * Renders the first page of the given PDF bytes as a PNG.
     *
     * @param pdfBytes raw bytes of a valid PDF document
     * @return PNG image bytes of the first page
     * @throws IllegalArgumentException if the bytes cannot be parsed as a PDF
     */
    public byte[] firstPageAsPng(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImageWithDPI(0, RENDER_DPI);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo convertir el PDF a imagen", e);
        }
    }
}
