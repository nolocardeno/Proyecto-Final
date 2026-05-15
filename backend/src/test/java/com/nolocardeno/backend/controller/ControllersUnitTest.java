package com.nolocardeno.backend.controller;

import com.nolocardeno.backend.dto.AuthRequest;
import com.nolocardeno.backend.dto.AuthResponse;
import com.nolocardeno.backend.dto.DashboardStats;
import com.nolocardeno.backend.dto.DocumentAlertRequest;
import com.nolocardeno.backend.dto.DocumentAlertResponse;
import com.nolocardeno.backend.dto.DocumentRequest;
import com.nolocardeno.backend.dto.DocumentResponse;
import com.nolocardeno.backend.dto.GroupDetailResponse;
import com.nolocardeno.backend.dto.GroupRequest;
import com.nolocardeno.backend.dto.GroupResponse;
import com.nolocardeno.backend.dto.RegisterRequest;
import com.nolocardeno.backend.dto.UpdateUserRequest;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.UserRepository;
import com.nolocardeno.backend.security.CustomUserDetails;
import com.nolocardeno.backend.service.AuthService;
import com.nolocardeno.backend.service.DashboardService;
import com.nolocardeno.backend.service.AlertSchedulerService;
import com.nolocardeno.backend.service.DocumentAlertService;
import com.nolocardeno.backend.service.DocumentService;
import com.nolocardeno.backend.service.GroupService;
import com.nolocardeno.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentMatchers;

@ExtendWith(MockitoExtension.class)
class ControllersUnitTest {

    @Mock AuthService authService;
    @Mock DashboardService dashboardService;
    @Mock DocumentAlertService alertService;
    @Mock GroupService groupService;
    @Mock DocumentService documentService;
    @Mock UserService userService;
    @Mock UserRepository userRepository;

    @InjectMocks AuthController authController;
    @InjectMocks DashboardController dashboardController;
    @InjectMocks DocumentAlertController alertController;
    @InjectMocks GroupController groupController;
    @InjectMocks UserController userController;

    private CustomUserDetails principal(long id, Role role) {
        User u = User.builder().id(id).email("u" + id + "@x.com").name("u" + id)
                .passwordHash("p").role(role).build();
        return new CustomUserDetails(u);
    }

    // ---------- AuthController ----------
    @Test
    void auth_register_returns_201() {
        AuthResponse resp = AuthResponse.builder().userId(1L).email("a@x.com").build();
        RegisterRequest req = new RegisterRequest();
        when(authService.register(req)).thenReturn(resp);

        ResponseEntity<AuthResponse> r = authController.register(req);

        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(r.getBody()).isEqualTo(resp);
    }

    @Test
    void auth_login_returns_200() {
        AuthResponse resp = AuthResponse.builder().userId(1L).build();
        AuthRequest req = new AuthRequest();
        when(authService.login(req)).thenReturn(resp);

        ResponseEntity<AuthResponse> r = authController.login(req);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void auth_logout_with_bearer_calls_service() {
        HttpServletRequest req = org.mockito.Mockito.mock(HttpServletRequest.class);
        when(req.getHeader("Authorization")).thenReturn("Bearer abc.def.ghi");

        ResponseEntity<Void> r = authController.logout(req);

        assertThat(r.getStatusCode().value()).isEqualTo(204);
        verify(authService).logout("abc.def.ghi");
    }

    @Test
    void auth_logout_without_header_skips_service() {
        HttpServletRequest req = org.mockito.Mockito.mock(HttpServletRequest.class);
        when(req.getHeader("Authorization")).thenReturn(null);

        ResponseEntity<Void> r = authController.logout(req);

        assertThat(r.getStatusCode().value()).isEqualTo(204);
        org.mockito.Mockito.verifyNoInteractions(authService);
    }

    // ---------- DashboardController ----------
    @Test
    void dashboard_returns_stats() {
        CustomUserDetails p = principal(7L, Role.USER);
        DashboardStats stats = DashboardStats.builder().totalDocuments(3L).build();
        when(dashboardService.getStats(7L)).thenReturn(stats);

        ResponseEntity<DashboardStats> r = dashboardController.getStats(p);

        assertThat(r.getBody()).isEqualTo(stats);
    }

    // ---------- DocumentAlertController ----------
    @Test
    void alerts_get_list() {
        CustomUserDetails p = principal(1L, Role.USER);
        List<DocumentAlertResponse> alerts = List.of();
        when(alertService.getAlerts(1L, 9L)).thenReturn(alerts);

        ResponseEntity<List<DocumentAlertResponse>> r = alertController.getAlerts(p, 9L);
        assertThat(r.getBody()).isEqualTo(alerts);
    }

    @Test
    void alerts_create_returns_201() {
        CustomUserDetails p = principal(1L, Role.USER);
        DocumentAlertRequest req = new DocumentAlertRequest();
        DocumentAlertResponse resp = DocumentAlertResponse.builder().id(2L).build();
        when(alertService.createAlert(1L, 9L, req)).thenReturn(resp);

        ResponseEntity<DocumentAlertResponse> r = alertController.createAlert(p, 9L, req);

        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(r.getBody()).isEqualTo(resp);
    }

    @Test
    void alerts_delete_returns_204() {
        CustomUserDetails p = principal(1L, Role.USER);

        ResponseEntity<Void> r = alertController.deleteAlert(p, 9L, 5L);

        assertThat(r.getStatusCode().value()).isEqualTo(204);
        verify(alertService).deleteAlert(1L, 9L, 5L);
    }

    // ---------- GroupController ----------
    @Test
    void group_get_all() {
        CustomUserDetails p = principal(1L, Role.USER);
        when(groupService.getGroupsByUser(1L)).thenReturn(List.of());
        assertThat(groupController.getAll(p).getBody()).isEqualTo(List.of());
    }

    @Test
    void group_get_by_id_and_detail_and_documents() {
        CustomUserDetails p = principal(1L, Role.USER);
        GroupResponse gr = GroupResponse.builder().id(2L).build();
        when(groupService.getGroup(1L, 2L)).thenReturn(gr);
        assertThat(groupController.getById(p, 2L).getBody()).isEqualTo(gr);

        GroupDetailResponse detail = GroupDetailResponse.builder().id(2L).build();
        when(groupService.getGroupDetail(1L, 2L)).thenReturn(detail);
        assertThat(groupController.getDetail(p, 2L).getBody()).isEqualTo(detail);

        when(groupService.getGroupDocuments(1L, 2L)).thenReturn(List.of());
        assertThat(groupController.getDocuments(p, 2L).getBody()).isEqualTo(List.of());
    }

    @Test
    void group_add_document_returns_201() {
        CustomUserDetails p = principal(1L, Role.USER);
        DocumentRequest req = new DocumentRequest();
        DocumentResponse resp = DocumentResponse.builder().id(8L).build();
        MockMultipartFile file = new MockMultipartFile("file", "x.png", "image/png", new byte[]{1});
        when(groupService.addDocumentToGroup(1L, 2L, req, file)).thenReturn(resp);

        ResponseEntity<DocumentResponse> r = groupController.addDocument(p, 2L, req, file);

        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(r.getBody()).isEqualTo(resp);
    }

    @Test
    void group_extract_document_from_image_returns_201() {
        CustomUserDetails p = principal(1L, Role.USER);
        DocumentResponse resp = DocumentResponse.builder().id(9L).build();
        MockMultipartFile file = new MockMultipartFile("file", "x.png", "image/png", new byte[]{1});
        when(documentService.createFromImage(1L, file, 2L, true)).thenReturn(resp);

        ResponseEntity<DocumentResponse> r = groupController.extractDocumentFromImage(p, 2L, file, true);

        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(r.getBody()).isEqualTo(resp);
    }

    @Test
    void group_create_returns_201_and_delete_returns_204_and_join_ok() {
        CustomUserDetails p = principal(1L, Role.USER);
        GroupRequest req = new GroupRequest();
        GroupResponse resp = GroupResponse.builder().id(3L).build();
        when(groupService.createGroup(1L, req)).thenReturn(resp);

        ResponseEntity<GroupResponse> created = groupController.create(p, req);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Void> deleted = groupController.delete(p, 3L);
        assertThat(deleted.getStatusCode().value()).isEqualTo(204);
        verify(groupService).deleteGroup(1L, 3L);

        when(groupService.joinGroup(1L, "ABC")).thenReturn(resp);
        ResponseEntity<GroupResponse> joined = groupController.join(p, Map.of("accessCode", "ABC"));
        assertThat(joined.getBody()).isEqualTo(resp);
    }

    // ---------- UserController ----------
    @Test
    void user_get_self_ok() {
        CustomUserDetails p = principal(1L, Role.USER);
        AuthResponse resp = AuthResponse.builder().userId(1L).build();
        when(userService.getUser(1L)).thenReturn(resp);

        assertThat(userController.getUser(1L, p).getBody()).isEqualTo(resp);
    }

    @Test
    void user_get_other_denied_for_non_admin() {
        CustomUserDetails p = principal(1L, Role.USER);
        assertThatThrownBy(() -> userController.getUser(2L, p))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void user_admin_can_access_others() {
        CustomUserDetails p = principal(1L, Role.ADMIN);
        AuthResponse resp = AuthResponse.builder().userId(2L).build();
        when(userService.getUser(2L)).thenReturn(resp);

        assertThat(userController.getUser(2L, p).getBody()).isEqualTo(resp);
    }

    @Test
    void user_null_principal_denied() {
        assertThatThrownBy(() -> userController.getUser(2L, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void user_get_profile_image_returns_resource() throws Exception {
        Resource resource = new ByteArrayResource("img".getBytes()) {
            @Override public String getFilename() { return "pic.png"; }
        };
        when(userService.getProfileImageResource(1L)).thenReturn(resource);

        ResponseEntity<Resource> r = userController.getProfileImage(1L);

        assertThat(r.getStatusCode().value()).isEqualTo(200);
        assertThat(r.getBody()).isEqualTo(resource);
    }

    @Test
    void user_update_self_ok() {
        CustomUserDetails p = principal(1L, Role.USER);
        UpdateUserRequest req = new UpdateUserRequest();
        AuthResponse resp = AuthResponse.builder().userId(1L).build();
        when(userService.updateUser(1L, req)).thenReturn(resp);

        assertThat(userController.updateUser(1L, p, req).getBody()).isEqualTo(resp);
    }

    @Test
    void user_upload_profile_image_ok() throws Exception {
        CustomUserDetails p = principal(1L, Role.USER);
        MockMultipartFile file = new MockMultipartFile("file", "p.png", "image/png", new byte[]{1});
        AuthResponse resp = AuthResponse.builder().userId(1L).build();
        when(userService.uploadProfileImage(1L, file)).thenReturn(resp);

        assertThat(userController.uploadProfileImage(1L, p, file).getBody()).isEqualTo(resp);
    }

    @Test
    void user_delete_self_returns_204() {
        CustomUserDetails p = principal(1L, Role.USER);

        ResponseEntity<Void> r = userController.deleteUser(1L, p);

        assertThat(r.getStatusCode().value()).isEqualTo(204);
        verify(userService).deleteUser(1L);
    }

    // ---------- AdminController ----------
    @Test
    void admin_list_users_returns_page() {
        AdminController admin = new AdminController(userRepository, mock(AlertSchedulerService.class));
        User u = User.builder().id(1L).email("a@x.com").name("A")
                .passwordHash("p").role(Role.ADMIN).build();
        Page<User> page = new PageImpl<>(List.of(u));
        Pageable pageable = PageRequest.of(0, 20);
        when(userRepository.findAll(ArgumentMatchers.<Specification<User>>any(), eq(pageable))).thenReturn(page);

        ResponseEntity<Page<AuthResponse>> r = admin.listUsers(Role.ADMIN, "a", pageable);

        assertThat(r.getStatusCode().value()).isEqualTo(200);
        assertThat(r.getBody()).isNotNull();
        assertThat(r.getBody().getContent()).hasSize(1);
        assertThat(r.getBody().getContent().get(0).getUserId()).isEqualTo(1L);
        assertThat(r.getBody().getContent().get(0).getRole()).isEqualTo("ADMIN");
    }

    @Test
    void admin_trigger_alerts_delegates_to_scheduler_and_returns_200() {
        AlertSchedulerService schedulerService = mock(AlertSchedulerService.class);
        AdminController admin = new AdminController(userRepository, schedulerService);

        ResponseEntity<String> r = admin.triggerAlerts();

        verify(schedulerService).processAlerts();
        assertThat(r.getStatusCode().value()).isEqualTo(200);
    }
}
