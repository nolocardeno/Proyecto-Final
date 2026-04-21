package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.DocumentAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DocumentAlertRepository extends JpaRepository<DocumentAlert, Long> {

    List<DocumentAlert> findByDocumentIdAndUserId(Long documentId, Long userId);

    Optional<DocumentAlert> findByDocumentIdAndUserIdAndDaysBeforeExpiry(
            Long documentId, Long userId, Integer daysBeforeExpiry);

    List<DocumentAlert> findByNotifiedAtIsNullAndDocumentExpiryDateIsNotNull();

    @Query("""
            SELECT a FROM DocumentAlert a
            JOIN FETCH a.user
            JOIN FETCH a.document
            WHERE a.document.expiryDate = :targetDate
            AND (a.notifiedAt IS NULL OR CAST(a.notifiedAt AS LocalDate) < :today)
            """)
    List<DocumentAlert> findAlertsToFire(@Param("targetDate") LocalDate targetDate,
                                         @Param("today") LocalDate today);
}

