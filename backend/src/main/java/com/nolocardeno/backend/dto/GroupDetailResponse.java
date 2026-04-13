package com.nolocardeno.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupDetailResponse {

    private Long id;
    private String name;
    private String description;
    private Long creatorId;
    private String accessCode;
    private Boolean allCanAddDocuments;
    private int memberCount;
    private int documentCount;
    private List<GroupMemberResponse> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
