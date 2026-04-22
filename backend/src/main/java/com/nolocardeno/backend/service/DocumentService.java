package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.*;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentHistory;
import com.nolocardeno.backend.model.RenewalHistory;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.DocumentHistoryType;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.repository.DocumentAlertRepository;
import com.nolocardeno.backend.repository.DocumentHistoryRepository;
import com.nolocardeno.backend.repository.DocumentRepository;
import com.nolocardeno.backend.repository.GroupRepository;
import com.nolocardeno.backend.repository.RenewalHistoryRepository;
import com.nolocardeno.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final RenewalHistoryRepository renewalHistoryRepository;
    private final DocumentHistoryRepository documentHistoryRepository;
    private final DocumentAlertRepository documentAlertRepository;
    private final GroupRepository groupRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public List<DocumentResponse> getDocumentsByUser(Long userId) {
        List<Document> docs = documentRepository.findPersonalDocumentsByUserId(userId);
        docs.forEach(this::updateDocumentStatus);
        documentRepository.saveAll(docs);
        return docs.stream()
                .map(DocumentMapper::toResponse)
                .toList();
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
