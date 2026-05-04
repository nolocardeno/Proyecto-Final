package com.nolocardeno.backend.service;

import com.nolocardeno.backend.dto.GroupRequest;
import com.nolocardeno.backend.dto.GroupResponse;
import com.nolocardeno.backend.exception.ResourceNotFoundException;
import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.DocumentGroup;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.DocumentHistoryRepository;
import com.nolocardeno.backend.repository.DocumentRepository;
import com.nolocardeno.backend.repository.GroupRepository;
import com.nolocardeno.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock GroupRepository groupRepository;
    @Mock UserRepository userRepository;
    @Mock DocumentRepository documentRepository;
    @Mock DocumentHistoryRepository documentHistoryRepository;
    @Mock FileStorageService fileStorageService;

    @InjectMocks GroupService service;

    private User user(Long id) {
        return User.builder().id(id).email(id + "@x.com").role(Role.USER).build();
    }

    private DocumentGroup group(Long id, User creator, List<User> members) {
        DocumentGroup g = DocumentGroup.builder()
                .id(id)
                .name("g" + id)
                .creator(creator)
                .accessCode("CODE" + id)
                .allCanAddDocuments(true)
                .build();
        g.setMembers(new ArrayList<>(members));
        g.setDocuments(new ArrayList<>());
        return g;
    }

    @Test
    void getGroupsByUser_merges_created_and_member_groups_distinctly() {
        User u = user(1L);
        DocumentGroup created = group(1L, u, List.of(u));
        DocumentGroup memberOf = group(2L, user(2L), List.of(u));
        when(groupRepository.findByCreatorIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(created));
        when(groupRepository.findByMembersIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(memberOf));

        List<GroupResponse> resp = service.getGroupsByUser(1L);

        assertThat(resp).hasSize(2);
    }

    @Test
    void getGroup_returns_response_when_member() {
        User u = user(1L);
        DocumentGroup g = group(5L, u, List.of(u));
        when(groupRepository.findById(5L)).thenReturn(Optional.of(g));
        GroupResponse resp = service.getGroup(1L, 5L);
        assertThat(resp.getId()).isEqualTo(5L);
    }

    @Test
    void getGroup_throws_when_not_member() {
        User creator = user(1L);
        DocumentGroup g = group(5L, creator, List.of(creator));
        when(groupRepository.findById(5L)).thenReturn(Optional.of(g));
        assertThatThrownBy(() -> service.getGroup(99L, 5L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createGroup_persists_with_creator_as_member() {
        User u = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(groupRepository.save(any(DocumentGroup.class))).thenAnswer(inv -> {
            DocumentGroup g = inv.getArgument(0);
            g.setId(7L);
            return g;
        });
        GroupRequest req = new GroupRequest();
        req.setName("New");
        req.setAllCanAddDocuments(true);

        GroupResponse resp = service.createGroup(1L, req);

        assertThat(resp.getId()).isEqualTo(7L);
        assertThat(resp.getName()).isEqualTo("New");
    }

    @Test
    void deleteGroup_only_creator_can_delete() {
        User creator = user(1L);
        User other = user(2L);
        DocumentGroup g = group(1L, creator, List.of(creator, other));
        when(groupRepository.findById(1L)).thenReturn(Optional.of(g));

        assertThatThrownBy(() -> service.deleteGroup(2L, 1L))
                .isInstanceOf(IllegalArgumentException.class);

        service.deleteGroup(1L, 1L);
        verify(groupRepository).delete(g);
    }

    @Test
    void joinGroup_adds_member_when_code_valid() {
        User u = user(2L);
        DocumentGroup g = group(1L, user(1L), List.of(user(1L)));
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        when(groupRepository.findByAccessCode("CODE1")).thenReturn(Optional.of(g));
        when(groupRepository.save(any(DocumentGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        service.joinGroup(2L, "CODE1");

        assertThat(g.getMembers()).extracting(User::getId).contains(2L);
    }

    @Test
    void joinGroup_rejects_already_member() {
        User u = user(1L);
        DocumentGroup g = group(1L, u, List.of(u));
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(groupRepository.findByAccessCode("CODE1")).thenReturn(Optional.of(g));

        assertThatThrownBy(() -> service.joinGroup(1L, "CODE1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void joinGroup_rejects_invalid_code() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(groupRepository.findByAccessCode("BAD")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.joinGroup(1L, "BAD"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getGroupDocuments_returns_documents_of_member() {
        User u = user(1L);
        DocumentGroup g = group(3L, u, List.of(u));
        Document d = Document.builder().id(1L).user(u).title("t").build();
        g.getDocuments().add(d);
        when(groupRepository.findById(3L)).thenReturn(Optional.of(g));

        var docs = service.getGroupDocuments(1L, 3L);
        assertThat(docs).hasSize(1);
    }
}
