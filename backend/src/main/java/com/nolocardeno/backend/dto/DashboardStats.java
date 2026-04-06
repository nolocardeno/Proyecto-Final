package com.nolocardeno.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {

    private long totalDocuments;
    private long activeDocuments;
    private long expiringSoonDocuments;
    private long expiredDocuments;
}
