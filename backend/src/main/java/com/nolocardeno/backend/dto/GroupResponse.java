package com.nolocardeno.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupResponse {

    private Long id;
    private String name;
    private Long creatorId;
    private Boolean allCanAddDocuments;
    private int memberCount;
    private int documentCount;
    private int activeDocumentCount;
    private int expiredDocumentCount;
    private List<GroupMemberResponse> memberPreviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
