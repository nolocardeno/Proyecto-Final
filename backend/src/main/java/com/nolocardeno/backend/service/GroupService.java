package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.*;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.DocumentGroup;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.repository.GroupRepository;
import com.nolocardeno.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<GroupResponse> getGroupsByUser(Long userId) {
        List<DocumentGroup> created = groupRepository.findByCreatorIdOrderByCreatedAtDesc(userId);
        List<DocumentGroup> memberOf = groupRepository.findByMembersIdOrderByCreatedAtDesc(userId);

        return Stream.concat(created.stream(), memberOf.stream())
                .distinct()
                .map(GroupMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroup(Long userId, Long groupId) {
        DocumentGroup group = findGroupByUser(userId, groupId);
        return GroupMapper.toResponse(group);
    }

    @Transactional(readOnly = true)
    public GroupDetailResponse getGroupDetail(Long userId, Long groupId) {
        DocumentGroup group = findGroupByUser(userId, groupId);
        return GroupMapper.toDetailResponse(group);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getGroupDocuments(Long userId, Long groupId) {
        DocumentGroup group = findGroupByUser(userId, groupId);
        return group.getDocuments().stream()
                .map(DocumentMapper::toResponse)
                .toList();
    }

    @Transactional
    public GroupResponse createGroup(Long userId, GroupRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        DocumentGroup group = DocumentGroup.builder()
                .name(request.getName())
                .creator(user)
                .allCanAddDocuments(request.getAllCanAddDocuments())
                .build();

        group.getMembers().add(user);
        group = groupRepository.save(group);

        return GroupMapper.toResponse(group);
    }

    @Transactional
    public void deleteGroup(Long userId, Long groupId) {
        DocumentGroup group = findGroupByUser(userId, groupId);
        if (!group.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("Solo el creador puede eliminar el grupo");
        }
        groupRepository.delete(group);
    }

    @Transactional
    public GroupResponse joinGroup(Long userId, String accessCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        DocumentGroup group = groupRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new ResourceNotFoundException("Código de acceso no válido"));

        boolean alreadyMember = group.getMembers().stream()
                .anyMatch(m -> m.getId().equals(userId));

        if (alreadyMember) {
            throw new IllegalArgumentException("Ya eres miembro de este grupo");
        }

        group.getMembers().add(user);
        groupRepository.save(group);

        return GroupMapper.toResponse(group);
    }

    private DocumentGroup findGroupByUser(Long userId, Long groupId) {
        DocumentGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));

        boolean isMember = group.getCreator().getId().equals(userId) ||
                group.getMembers().stream().anyMatch(m -> m.getId().equals(userId));

        if (!isMember) {
            throw new ResourceNotFoundException("Grupo no encontrado");
        }
        return group;
    }
}
