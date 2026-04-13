package com.nolocardeno.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberResponse {

    private Long userId;
    private String name;
    private String profileImagePath;
}
