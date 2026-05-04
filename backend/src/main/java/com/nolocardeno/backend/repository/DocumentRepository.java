package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {

    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT d FROM Document d WHERE d.user.id = :userId " +
           "AND NOT EXISTS (SELECT 1 FROM DocumentGroup g JOIN g.documents gd WHERE gd = d) " +
           "ORDER BY d.createdAt DESC")
    List<Document> findPersonalDocumentsByUserId(@Param("userId") Long userId);

    List<Document> findByUserIdAndType(Long userId, DocumentType type);

    List<Document> findByUserIdAndStatus(Long userId, DocumentStatus status);

    List<Document> findByExpiryDateBeforeAndStatusNot(LocalDate date, DocumentStatus status);

    List<Document> findByUserIdAndStoreNameIgnoreCaseAndIssueDateAndAmount(
            Long userId, String storeName, LocalDate issueDate, java.math.BigDecimal amount);
}
