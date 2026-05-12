package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.*;
import com.nolocardeno.backend.dto.processing.ExtractionResult;
import com.nolocardeno.backend.dto.processing.ExtractionSource;
import com.nolocardeno.backend.dto.processing.ExtractionStatus;
import com.nolocardeno.backend.dto.processing.ProcessDocumentResponse;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentGroup;
import com.nolocardeno.backend.model.DocumentHistory;
import com.nolocardeno.backend.model.RenewalHistory;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.DocumentHistoryType;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import com.nolocardeno.backend.repository.DocumentAlertRepository;
import com.nolocardeno.backend.repository.DocumentHistoryRepository;
import com.nolocardeno.backend.repository.DocumentRepository;
import com.nolocardeno.backend.repository.GroupRepository;
import com.nolocardeno.backend.repository.RenewalHistoryRepository;
import com.nolocardeno.backend.repository.UserRepository;
import com.nolocardeno.backend.repository.spec.DocumentSpecifications;
import com.nolocardeno.backend.service.processing.DocumentProcessingPipeline;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int MAX_TITLE_LENGTH = 30;

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final RenewalHistoryRepository renewalHistoryRepository;
    private final DocumentHistoryRepository documentHistoryRepository;
    private final DocumentAlertRepository documentAlertRepository;
    private final GroupRepository groupRepository;
    private final FileStorageService fileStorageService;
    private final DocumentProcessingPipeline processingPipeline;

    @Transactional
    public List<DocumentResponse> getDocumentsByUser(Long userId) {
        List<Document> docs = documentRepository.findPersonalDocumentsByUserId(userId);
        docs.forEach(this::updateDocumentStatus);
        documentRepository.saveAll(docs);
        return docs.stream()
                .map(DocumentMapper::toResponse)
                .toList();
    }

    /**
     * Búsqueda paginada con filtros opcionales sobre los documentos del
     * usuario. Cualquier filtro {@code null}/blanco se ignora.
     *
     * @param userId   propietario de los documentos
     * @param status   estado exacto a filtrar (o {@code null})
     * @param type     tipo exacto a filtrar (o {@code null})
     * @param q        texto a buscar en {@code title} y {@code storeName}
     * @param pageable paginación y ordenación
     */
    @Transactional
    public Page<DocumentResponse> searchDocuments(Long userId,
                                                  DocumentStatus status,
                                                  DocumentType type,
                                                  String q,
                                                  Pageable pageable) {
        Specification<Document> spec = Specification.where(DocumentSpecifications.ownedBy(userId))
                .and(DocumentSpecifications.hasStatus(status))
                .and(DocumentSpecifications.hasType(type))
                .and(DocumentSpecifications.textMatches(q));
        return documentRepository.findAll(spec, pageable).map(doc -> {
            updateDocumentStatus(doc);
            return DocumentMapper.toResponse(doc);
        });
    }

    @Transactional
    public DocumentResponse getDocument(Long userId, Long documentId) {
        Document doc = findDocumentByUser(userId, documentId);
        updateDocumentStatus(doc);
        documentRepository.save(doc);
        return DocumentMapper.toResponse(doc);
    }

    @Transactional
    public DocumentResponse createDocument(Long userId, DocumentRequest request, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Document doc = Document.builder()
                .user(user)
                .type(request.getType())
                .kind(request.getKind())
                .title(request.getTitle())
                .category(request.getCategory())
                .storeName(request.getStoreName())
                .amount(request.getAmount())
                .issueDate(request.getIssueDate())
                .expiryDate(request.getExpiryDate())
                .notes(request.getNotes())
                .status(DocumentStatus.ACTIVE)
                .build();

        if (file != null && !file.isEmpty()) {
            try {
                doc.setImagePath(fileStorageService.store(file));
            } catch (IOException e) {
                throw new RuntimeException("No se pudo guardar la imagen", e);
            }
        }

        updateDocumentStatus(doc);
        doc = documentRepository.save(doc);
        recordHistory(doc, user, DocumentHistoryType.CREATED, "Documento creado");

        return DocumentMapper.toResponse(doc);
    }

    /**
     * Create a document from an uploaded image by running the AI+OCR
     * processing pipeline. The extracted data is persisted as a new Document
     * owned by the given user. Throws IllegalArgumentException if no usable
     * data could be extracted.
     */
    @Transactional
    public DocumentResponse createFromImage(Long userId, MultipartFile file) {
        return createFromImage(userId, file, null, false);
    }

    /**
     * Create a document from an uploaded image, optionally attaching it to a
     * group. When {@code groupId} is provided, the caller must be a member of
     * the group with permission to add documents. The resulting document is
     * shared with every member of the group.
     */
    @Transactional
    public DocumentResponse createFromImage(Long userId, MultipartFile file, Long groupId) {
        return createFromImage(userId, file, groupId, false);
    }

    @Transactional
    public DocumentResponse createFromImage(Long userId, MultipartFile file, Long groupId, boolean useAi) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        DocumentGroup group = null;
        if (groupId != null) {
            group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
            boolean isMember = group.getCreator().getId().equals(userId)
                    || group.getMembers().stream().anyMatch(m -> m.getId().equals(userId));
            if (!isMember) {
                throw new ResourceNotFoundException("Grupo no encontrado");
            }
            boolean isCreator = group.getCreator().getId().equals(userId);
            if (!isCreator && !group.getAllCanAddDocuments()) {
                throw new IllegalArgumentException(
                        "No tienes permisos para añadir documentos a este grupo");
            }
        }

        ProcessDocumentResponse result = processingPipeline.process(file, useAi);
        ExtractionResult data = result.data();

        if (data == null || result.status() == ExtractionStatus.FAILED) {
            String reason;
            if (result.source() == null) {
                reason = "no se pudo procesar la imagen (ni IA ni OCR disponibles).";
            } else if (result.source() == ExtractionSource.OCR) {
                reason = "el OCR no pudo leer texto de la imagen. Asegúrate de que la imagen está enfocada y legible, o activa la extracción con IA.";
            } else {
                reason = "la IA no devolvió datos válidos.";
            }
            throw new IllegalArgumentException("No se pudo extraer información: " + reason);
        }

        DocumentType type = data.detectedType() != null ? data.detectedType() : DocumentType.OTHER;
        boolean isReceiptLike = type == DocumentType.RECEIPT
                || type == DocumentType.INVOICE
                || type == DocumentType.WARRANTY;

        boolean isClothing = type == DocumentType.RECEIPT
                && com.nolocardeno.backend.service.processing.OcrTextParser.looksLikeClothing(data.rawText());
        // The AI marks returnable tickets (ropa, calzado, etc.) with
        // receiptCategory = "devolucion". Treat that the same as OCR's
        // clothing heuristic for the return-window logic below.
        boolean isReturnable = isClothing
                || (data.receiptCategory() != null
                        && data.receiptCategory().trim().toLowerCase(Locale.ROOT).startsWith("devoluc"));
        // Receipts/invoices/warranties tagged by the AI as "garantia" cover
        // durable goods (electrodomésticos, informática, etc.) which carry
        // the 3-year Spanish legal warranty for new products.
        boolean isWarrantyPurchase = (type == DocumentType.WARRANTY)
                || (isReceiptLike && data.receiptCategory() != null
                        && data.receiptCategory().trim().toLowerCase(Locale.ROOT).startsWith("garant"));

        boolean isOfficialSpanish = type == DocumentType.DNI
                || type == DocumentType.PASSPORT
                || type == DocumentType.DRIVING_LICENSE
                || type == DocumentType.ITV;

        // All receipts use the "Devolución" category; the clothing flag only
        // affects the title and the return-window deadline.
        String category = buildCategory(type, data);
        // Spanish official documents are issued by the State; override the
        // (empty) merchant with a stable, recognizable entity name. The
        // driving license is a special case: although it's a State-issued
        // document, it's specifically managed by the DGT, which is the
        // entity users expect to see in the "Comercio" field.
        String merchant = data.merchant();
        if (isOfficialSpanish && (merchant == null || merchant.isBlank())) {
            merchant = switch (type) {
                case DRIVING_LICENSE -> "DGT";
                default -> "Gobierno de España";
            };
        }
        LocalDate expiry = data.expiryDate();
        // Auto-fill the deadline when the AI/OCR could not read it from the
        // image, applying the Spanish legal/commercial defaults:
        //  - garantía de productos nuevos: 3 años desde la compra
        //  - devolución de ropa/textil: 15 días desde la compra
        //  - documentos oficiales: validez típica según el tipo
        if (expiry == null && isWarrantyPurchase && data.issueDate() != null) {
            expiry = data.issueDate().plusYears(3);
        } else if (expiry == null && isReturnable && data.issueDate() != null) {
            expiry = data.issueDate().plusDays(15);
        } else if (expiry == null && isOfficialSpanish && data.issueDate() != null) {
            expiry = defaultOfficialExpiry(type, data.issueDate());
        } else if (expiry == null && type == DocumentType.INSURANCE && data.issueDate() != null) {
            // Pólizas de seguro habituales: vigencia anual.
            expiry = data.issueDate().plusYears(1);
        }

        Document doc = Document.builder()
                .user(user)
                .type(type)
                .kind(isReceiptLike ? "ticket" : "document")
                .title(buildTitle(data, isClothing))
                .category(category)
                .storeName(merchant)
                .amount(data.totalAmount())
                .issueDate(data.issueDate())
                .expiryDate(expiry)
                .imagePath(result.imagePath())
                .aiProcessed(result.source() == ExtractionSource.AI)
                .status(DocumentStatus.ACTIVE)
                .build();

        updateDocumentStatus(doc);
        doc = documentRepository.save(doc);

        if (group != null) {
            group.getDocuments().add(doc);
            groupRepository.save(group);
        }

        String sourceLabel = result.source() == ExtractionSource.AI ? "IA" : "OCR";
        recordHistory(doc, user, DocumentHistoryType.CREATED,
                "Documento creado desde imagen (" + sourceLabel + ", confianza "
                        + Math.round(result.overallConfidence() * 100) + "%)");

        return DocumentMapper.toResponse(doc);
    }

    private String buildTitle(ExtractionResult data, boolean isClothing) {
        DocumentType type = data.detectedType();
        // Official documents: prefer "<Tipo> - <Nombre>" when the AI extracted
        // a holder name. Fall back to the plain type label otherwise.
        String officialLabel = switch (type == null ? DocumentType.OTHER : type) {
            case DNI -> "DNI";
            case PASSPORT -> "Pasaporte";
            case DRIVING_LICENSE -> "Carnet de conducir";
            case ITV -> "ITV";
            case INSURANCE -> "Seguro";
            default -> null;
        };
        if (officialLabel != null) {
            String name = normalizeHolderName(data.holderName());
            String title = name != null ? officialLabel + " - " + name : officialLabel;
            return truncate(title);
        }

        String candidate = null;
        if (type == DocumentType.RECEIPT || type == DocumentType.INVOICE
                || type == DocumentType.WARRANTY) {
            // User preference: receipts should always be "Ticket - <comercio>"
            // so the name is recognizable at a glance. The user can edit it
            // afterwards.
            String m = data.merchant();
            if (m != null && !m.isBlank()) {
                candidate = "Ticket - " + capitalize(m);
            } else {
                candidate = "Ticket";
            }
        } else if (data.merchant() != null && !data.merchant().isBlank()) {
            candidate = capitalize(data.merchant());
        } else if (type != null) {
            candidate = typeLabel(type);
        }
        if (candidate == null || candidate.isBlank()) {
            candidate = "Documento importado";
        }
        return truncate(candidate);
    }

    private String truncate(String s) {
        String t = s == null ? "" : s.trim();
        if (t.length() > MAX_TITLE_LENGTH) {
            t = t.substring(0, MAX_TITLE_LENGTH).trim();
        }
        return t;
    }

    /**
     * Normalize a holder name to "Title Case" and keep only the first token
     * (given name) so the title stays compact and personal. Returns null when
     * the name is missing or clearly invalid.
     */
    private String normalizeHolderName(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String cleaned = raw.replaceAll("[<>&\"'|]+", " ").trim();
        if (cleaned.isEmpty()) return null;
        String[] tokens = cleaned.split("\\s+");
        for (String t : tokens) {
            if (!t.isEmpty()) {
                return capitalize(t);
            }
        }
        return null;
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        String lower = s.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private String buildCategory(DocumentType type, ExtractionResult data) {
        // Receipt / invoice / warranty: honor the AI-suggested category when
        // present. Recognized consumption tickets (supermercado, restaurantes,
        // gasolineras, etc.) go to "Consumo"; only fall back to "Otro" when
        // the AI could not classify the ticket at all.
        if (type == DocumentType.RECEIPT || type == DocumentType.INVOICE) {
            String hint = data == null ? null : data.receiptCategory();
            if (hint != null) {
                String h = hint.trim().toLowerCase(Locale.ROOT);
                if (h.startsWith("garant")) return "Garantía";
                if (h.startsWith("devoluc")) return "Devolución";
                if (h.startsWith("consum")) return "Consumo";
                if (h.equals("otro")) return "Consumo";
            }
            return "Otro";
        }
        return switch (type) {
            case WARRANTY -> "Garantía";
            case DNI -> "DNI";
            case PASSPORT -> "Pasaporte";
            case DRIVING_LICENSE -> "Carnet de conducir";
            case ITV -> "ITV";
            case INSURANCE -> "Seguro";
            default -> null;
        };
    }

    private String typeLabel(DocumentType type) {
        return switch (type) {
            case RECEIPT -> "Ticket";
            case WARRANTY -> "Garantía";
            case INVOICE -> "Factura";
            case DNI -> "DNI";
            case PASSPORT -> "Pasaporte";
            case DRIVING_LICENSE -> "Carnet de conducir";
            case ITV -> "ITV";
            case INSURANCE -> "Seguro";
            default -> "Documento";
        };
    }

    /**
     * Default expiry for Spanish official documents when the image did not
     * include a readable validity date. These approximate the standard adult
     * issuance terms; the user can always edit the date later from the UI.
     */
    private LocalDate defaultOfficialExpiry(DocumentType type, LocalDate issue) {
        if (issue == null) return null;
        return switch (type) {
            case DNI -> issue.plusYears(10);
            case PASSPORT -> issue.plusYears(10);
            case DRIVING_LICENSE -> issue.plusYears(10);
            case ITV -> issue.plusYears(1);
            default -> null;
        };
    }

    @Transactional
    public DocumentResponse updateDocument(Long userId, Long documentId, DocumentRequest request, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        Document doc = findDocumentByUser(userId, documentId);

        boolean hasDataChanges = false;
        boolean hasDateChanges = false;
        List<String> changes = new ArrayList<>();

        // Orden de campos según criterios de aceptación: Título, Comercio, Tipo, Categoría,
        // Importe, Notas, Fecha de emisión, Fecha de expiración — Imagen se añade al final.
        if (!Objects.equals(doc.getTitle(), request.getTitle())) {
            changes.add("Título: \"" + doc.getTitle() + "\" → \"" + request.getTitle() + "\"");
            hasDataChanges = true;
        }
        if (!Objects.equals(doc.getStoreName(), request.getStoreName())) {
            String from = doc.getStoreName() != null ? doc.getStoreName() : "—";
            String to = request.getStoreName() != null ? request.getStoreName() : "—";
            changes.add("Comercio: " + from + " → " + to);
            hasDataChanges = true;
        }
        String fromKind = doc.getKind() != null ? kindDisplayLabel(doc.getKind()) : toKindLabel(doc.getType());
        String toKind   = request.getKind() != null ? kindDisplayLabel(request.getKind()) : toKindLabel(request.getType());
        if (!fromKind.equals(toKind)) {
            changes.add("Tipo: " + fromKind + " → " + toKind);
            hasDataChanges = true;
        }
        if (!Objects.equals(doc.getCategory(), request.getCategory())) {
            String from = doc.getCategory() != null ? doc.getCategory() : "—";
            String to = request.getCategory() != null ? request.getCategory() : "—";
            changes.add("Categoría: " + from + " → " + to);
            hasDataChanges = true;
        }
        if (!Objects.equals(doc.getAmount(), request.getAmount())) {
            String from = doc.getAmount() != null ? doc.getAmount().toPlainString() + "€" : "—";
            String to = request.getAmount() != null ? request.getAmount().toPlainString() + "€" : "—";
            changes.add("Importe: " + from + " → " + to);
            hasDataChanges = true;
        }
        if (!Objects.equals(doc.getNotes(), request.getNotes())) {
            changes.add("Notas actualizadas");
            hasDataChanges = true;
        }
        if (!Objects.equals(doc.getIssueDate(), request.getIssueDate())) {
            String from = doc.getIssueDate() != null ? doc.getIssueDate().format(DATE_FMT) : "—";
            String to = request.getIssueDate() != null ? request.getIssueDate().format(DATE_FMT) : "—";
            changes.add("Fecha de emisión: " + from + " → " + to);
            hasDateChanges = true;
        }
        if (!Objects.equals(doc.getExpiryDate(), request.getExpiryDate())) {
            String from = doc.getExpiryDate() != null ? doc.getExpiryDate().format(DATE_FMT) : "—";
            String to = request.getExpiryDate() != null ? request.getExpiryDate().format(DATE_FMT) : "—";
            changes.add("Fecha de expiración: " + from + " → " + to);
            hasDateChanges = true;
        }

        doc.setType(request.getType());
        doc.setKind(request.getKind());
        doc.setTitle(request.getTitle());
        doc.setCategory(request.getCategory());
        doc.setStoreName(request.getStoreName());
        doc.setAmount(request.getAmount());
        doc.setIssueDate(request.getIssueDate());
        doc.setExpiryDate(request.getExpiryDate());
        doc.setNotes(request.getNotes());

        // La imagen se añade al final de la descripción (último en el orden del AC)
        boolean imageUpdated = (file != null && !file.isEmpty());
        if (imageUpdated) {
            if (doc.getImagePath() != null) {
                fileStorageService.delete(doc.getImagePath());
            }
            try {
                doc.setImagePath(fileStorageService.store(file));
            } catch (IOException e) {
                throw new RuntimeException("No se pudo guardar la imagen", e);
            }
            changes.add("Imagen actualizada");
        }

        updateDocumentStatus(doc);
        doc = documentRepository.save(doc);

        if (!changes.isEmpty()) {
            DocumentHistoryType histType;
            if (imageUpdated && !hasDataChanges && !hasDateChanges) {
                histType = DocumentHistoryType.IMAGE_UPLOADED;
            } else if (!imageUpdated && !hasDataChanges) {
                histType = DocumentHistoryType.DATES_UPDATED;
            } else {
                histType = DocumentHistoryType.UPDATED;
            }
            recordHistory(doc, user, histType, String.join("\n", changes));
        }

        return DocumentMapper.toResponse(doc);
    }

    @Transactional
    public void deleteDocument(Long userId, Long documentId) {
        Document doc = findDocumentByUser(userId, documentId);
        groupRepository.removeDocumentFromAllGroups(documentId);
        documentHistoryRepository.deleteByDocumentId(documentId);
        documentAlertRepository.deleteByDocumentId(documentId);
        if (doc.getImagePath() != null) {
            fileStorageService.delete(doc.getImagePath());
        }
        documentRepository.delete(doc);
    }

    @Transactional
    public DocumentResponse renewDocument(Long userId, Long documentId, LocalDate newExpiryDate) {
        Document doc = findDocumentByUser(userId, documentId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        RenewalHistory history = RenewalHistory.builder()
                .document(doc)
                .previousExpiryDate(doc.getExpiryDate())
                .newExpiryDate(newExpiryDate)
                .renewedAt(LocalDateTime.now())
                .build();
        renewalHistoryRepository.save(history);

        doc.setExpiryDate(newExpiryDate);
        doc.setStatus(DocumentStatus.ACTIVE);
        doc = documentRepository.save(doc);
        recordHistory(doc, user, DocumentHistoryType.RENEWED, "Renovación de fecha de caducidad");

        return DocumentMapper.toResponse(doc);
    }

    @Transactional(readOnly = true)
    public List<RenewalHistoryResponse> getRenewalHistory(Long userId, Long documentId) {
        findDocumentByUser(userId, documentId);
        return renewalHistoryRepository.findByDocumentIdOrderByRenewedAtDesc(documentId).stream()
                .map(DocumentMapper::toRenewalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentHistoryResponse> getDocumentHistory(Long userId, Long documentId) {
        findDocumentByUser(userId, documentId);
        return documentHistoryRepository.findByDocumentIdOrderByChangedAtDesc(documentId).stream()
                .map(DocumentMapper::toHistoryResponse)
                .toList();
    }

    private void recordHistory(Document doc, User user, DocumentHistoryType changeType, String description) {
        DocumentHistory entry = DocumentHistory.builder()
                .document(doc)
                .changedBy(user)
                .changeType(changeType)
                .description(description)
                .build();
        documentHistoryRepository.save(entry);
    }

    @Transactional
    public DocumentResponse uploadDocumentImage(Long userId, Long documentId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        Document doc = findDocumentByUser(userId, documentId);

        if (doc.getImagePath() != null) {
            fileStorageService.delete(doc.getImagePath());
        }

        try {
            String imagePath = fileStorageService.store(file);
            doc.setImagePath(imagePath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo guardar la imagen", e);
        }

        doc = documentRepository.save(doc);
        recordHistory(doc, user, DocumentHistoryType.IMAGE_UPLOADED, "Actualización de imagen");
        return DocumentMapper.toResponse(doc);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> checkDuplicates(Long userId, DocumentRequest request) {
        if (request.getStoreName() == null || request.getIssueDate() == null || request.getAmount() == null) {
            return List.of();
        }
        return documentRepository.findByUserIdAndStoreNameIgnoreCaseAndIssueDateAndAmount(
                        userId, request.getStoreName(), request.getIssueDate(), request.getAmount()).stream()
                .map(DocumentMapper::toResponse)
                .toList();
    }

    private Document findDocumentByUser(Long userId, Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado"));
        boolean isOwner = doc.getUser().getId().equals(userId);
        boolean isGroupMember = groupRepository.existsByDocumentsIdAndMembersId(documentId, userId);
        if (!isOwner && !isGroupMember) {
            throw new ResourceNotFoundException("Documento no encontrado");
        }
        return doc;
    }

    private String kindDisplayLabel(String kind) {
        return "ticket".equalsIgnoreCase(kind) ? "Ticket" : "Documento";
    }

    private String toKindLabel(com.nolocardeno.backend.model.enums.DocumentType type) {
        return switch (type) {
            case RECEIPT, WARRANTY, INVOICE -> "Ticket";
            default -> "Documento";
        };
    }

    private void updateDocumentStatus(Document doc) {
        if (doc.getExpiryDate() == null) {
            doc.setStatus(DocumentStatus.ACTIVE);
            return;
        }
        LocalDate now = LocalDate.now();
        if (doc.getExpiryDate().isBefore(now)) {
            doc.setStatus(DocumentStatus.EXPIRED);
        } else if (doc.getExpiryDate().isBefore(now.plusDays(30))) {
            doc.setStatus(DocumentStatus.EXPIRING_SOON);
        } else {
            doc.setStatus(DocumentStatus.ACTIVE);
        }
    }

}
