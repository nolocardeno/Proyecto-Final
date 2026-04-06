package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.RenewalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RenewalHistoryRepository extends JpaRepository<RenewalHistory, Long> {

    List<RenewalHistory> findByDocumentIdOrderByRenewedAtDesc(Long documentId);
}
