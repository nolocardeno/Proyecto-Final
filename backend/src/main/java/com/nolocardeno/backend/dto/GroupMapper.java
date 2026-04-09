package com.nolocardeno.backend.dto;

import com.nolocardeno.backend.model.DocumentGroup;

public final class GroupMapper {

    private GroupMapper() {
    }

    public static GroupResponse toResponse(DocumentGroup group) {
        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .creatorId(group.getCreator().getId())
                .allCanAddDocuments(group.getAllCanAddDocuments())
                .memberCount(group.getMembers().size())
                .documentCount(group.getDocuments().size())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
