package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.DocumentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentHistoryRepository extends JpaRepository<DocumentHistory, Long> {

    List<DocumentHistory> findByDocumentIdOrderByChangedAtDesc(Long documentId);

    void deleteByDocumentId(Long documentId);
}
