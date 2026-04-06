package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.DashboardStats;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public DashboardStats getStats(Long userId) {
        var allDocs = documentRepository.findByUserIdOrderByCreatedAtDesc(userId);

        long total = allDocs.size();
        long active = allDocs.stream().filter(d -> d.getStatus() == DocumentStatus.ACTIVE).count();
        long expiringSoon = allDocs.stream().filter(d -> d.getStatus() == DocumentStatus.EXPIRING_SOON).count();
        long expired = allDocs.stream().filter(d -> d.getStatus() == DocumentStatus.EXPIRED).count();

        return DashboardStats.builder()
                .totalDocuments(total)
                .activeDocuments(active)
                .expiringSoonDocuments(expiringSoon)
                .expiredDocuments(expired)
                .build();
    }
}
