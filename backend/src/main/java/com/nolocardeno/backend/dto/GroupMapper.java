package com.nolocardeno.backend.dto;

import com.nolocardeno.backend.model.DocumentGroup;

import java.time.LocalDate;
import java.util.List;

public final class GroupMapper {

    private GroupMapper() {
    }

    private static final int MAX_MEMBER_PREVIEWS = 3;

    public static GroupResponse toResponse(DocumentGroup group) {
        List<GroupMemberResponse> previews = group.getMembers().stream()
                .limit(MAX_MEMBER_PREVIEWS)
                .map(user -> GroupMemberResponse.builder()
                        .userId(user.getId())
                        .name(user.getName())
                        .profileImagePath(user.getProfileImagePath())
                        .build())
                .toList();

        int expired = (int) group.getDocuments().stream()
                .filter(d -> d.getExpiryDate() != null && d.getExpiryDate().isBefore(LocalDate.now()))
                .count();

        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .creatorId(group.getCreator().getId())
                .allCanAddDocuments(group.getAllCanAddDocuments())
                .memberCount(group.getMembers().size())
                .documentCount(group.getDocuments().size())
                .activeDocumentCount(group.getDocuments().size() - expired)
                .expiredDocumentCount(expired)
                .memberPreviews(previews)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    public static GroupDetailResponse toDetailResponse(DocumentGroup group) {
        List<GroupMemberResponse> members = group.getMembers().stream()
                .map(user -> GroupMemberResponse.builder()
                        .userId(user.getId())
                        .name(user.getName())
                        .profileImagePath(user.getProfileImagePath())
                        .build())
                .toList();

        return GroupDetailResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .creatorId(group.getCreator().getId())
                .accessCode(group.getAccessCode())
                .allCanAddDocuments(group.getAllCanAddDocuments())
                .memberCount(group.getMembers().size())
                .documentCount(group.getDocuments().size())
                .members(members)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
