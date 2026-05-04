package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.DashboardStats;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.repository.DocumentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock DocumentRepository documentRepository;
    @InjectMocks DashboardService service;

    @Test
    void getStats_counts_documents_by_status() {
        when(documentRepository.findPersonalDocumentsByUserId(1L)).thenReturn(List.of(
                Document.builder().status(DocumentStatus.ACTIVE).build(),
                Document.builder().status(DocumentStatus.ACTIVE).build(),
                Document.builder().status(DocumentStatus.EXPIRING_SOON).build(),
                Document.builder().status(DocumentStatus.EXPIRED).build()
        ));

        DashboardStats stats = service.getStats(1L);

        assertThat(stats.getTotalDocuments()).isEqualTo(4);
        assertThat(stats.getActiveDocuments()).isEqualTo(2);
        assertThat(stats.getExpiringSoonDocuments()).isEqualTo(1);
        assertThat(stats.getExpiredDocuments()).isEqualTo(1);
    }

    @Test
    void getStats_returns_zeros_when_no_documents() {
        when(documentRepository.findPersonalDocumentsByUserId(2L)).thenReturn(List.of());
        DashboardStats stats = service.getStats(2L);
        assertThat(stats.getTotalDocuments()).isZero();
        assertThat(stats.getActiveDocuments()).isZero();
    }
}
