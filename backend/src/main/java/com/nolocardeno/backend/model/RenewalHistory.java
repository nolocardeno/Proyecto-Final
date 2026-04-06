package com.nolocardeno.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "renewal_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "previous_expiry_date", nullable = false)
    private LocalDate previousExpiryDate;

    @Column(name = "new_expiry_date", nullable = false)
    private LocalDate newExpiryDate;

    @Column(name = "renewed_at", nullable = false)
    private LocalDateTime renewedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
