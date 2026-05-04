package com.nolocardeno.backend.repository.spec;

import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserSpecificationsTest {

    @Autowired UserRepository userRepository;

    @Test
    void filter_by_role_and_text() {
        userRepository.save(User.builder()
                .email("admin-uspec@x.com").name("Admin Master")
                .passwordHash("p").role(Role.ADMIN).build());
        userRepository.save(User.builder()
                .email("user1-uspec@x.com").name("Pedro")
                .passwordHash("p").role(Role.USER).build());
        userRepository.save(User.builder()
                .email("user2-uspec@x.com").name("Ana")
                .passwordHash("p").role(Role.USER).build());

        Specification<User> spec = Specification
                .where(UserSpecifications.hasRole(Role.USER))
                .and(UserSpecifications.textMatches("ped"));

        Page<User> page = userRepository.findAll(spec, PageRequest.of(0, 20));
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getName()).isEqualTo("Pedro");
    }

    @Test
    void null_filters_return_null_spec() {
        assertThat(UserSpecifications.hasRole(null)).isNull();
        assertThat(UserSpecifications.textMatches(null)).isNull();
        assertThat(UserSpecifications.textMatches("")).isNull();
    }
}
