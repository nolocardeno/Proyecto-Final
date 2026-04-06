package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.*;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.RenewalHistory;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.repository.DocumentRepository;
import com.nolocardeno.backend.repository.RenewalHistoryRepository;
import com.nolocardeno.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final RenewalHistoryRepository renewalHistoryRepository;

    @Transactional
    public List<DocumentResponse> getDocumentsByUser(Long userId) {
        List<Document> docs = documentRepository.findByUserIdOrderByCreatedAtDesc(userId);
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
    public DocumentResponse createDocument(Long userId, DocumentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Document doc = Document.builder()
                .user(user)
                .type(request.getType())
                .title(request.getTitle())
                .category(request.getCategory())
                .storeName(request.getStoreName())
                .amount(request.getAmount())
                .issueDate(request.getIssueDate())
                .expiryDate(request.getExpiryDate())
                .notes(request.getNotes())
                .status(DocumentStatus.ACTIVE)
                .build();

        updateDocumentStatus(doc);
        doc = documentRepository.save(doc);

        return DocumentMapper.toResponse(doc);
    }

    @Transactional
    public DocumentResponse updateDocument(Long userId, Long documentId, DocumentRequest request) {
        Document doc = findDocumentByUser(userId, documentId);

        doc.setType(request.getType());
        doc.setTitle(request.getTitle());
        doc.setCategory(request.getCategory());
        doc.setStoreName(request.getStoreName());
        doc.setAmount(request.getAmount());
        doc.setIssueDate(request.getIssueDate());
        doc.setExpiryDate(request.getExpiryDate());
        doc.setNotes(request.getNotes());

        updateDocumentStatus(doc);
        doc = documentRepository.save(doc);

        return DocumentMapper.toResponse(doc);
    }

    @Transactional
    public void deleteDocument(Long userId, Long documentId) {
        Document doc = findDocumentByUser(userId, documentId);
        documentRepository.delete(doc);
    }

    @Transactional
    public DocumentResponse renewDocument(Long userId, Long documentId, LocalDate newExpiryDate) {
        Document doc = findDocumentByUser(userId, documentId);

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
        if (!doc.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Documento no encontrado");
        }
        return doc;
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
