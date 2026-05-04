package com.nolocardeno.backend.repository.spec;

import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import com.nolocardeno.backend.model.enums.Role;
import com.nolocardeno.backend.repository.DocumentRepository;
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
class DocumentSpecificationsTest {

    @Autowired UserRepository userRepository;
    @Autowired DocumentRepository documentRepository;

    @Test
    void specs_filter_by_owner_status_type_and_text() {
        User alice = userRepository.save(User.builder()
                .email("alice-spec@x.com").name("alice").passwordHash("p").role(Role.USER).build());
        User bob = userRepository.save(User.builder()
                .email("bob-spec@x.com").name("bob").passwordHash("p").role(Role.USER).build());

        documentRepository.save(Document.builder()
                .user(alice).type(DocumentType.RECEIPT).title("Compra Mercadona")
                .storeName("Mercadona").status(DocumentStatus.ACTIVE).build());
        documentRepository.save(Document.builder()
                .user(alice).type(DocumentType.DNI).title("DNI personal")
                .status(DocumentStatus.EXPIRED).build());
        documentRepository.save(Document.builder()
                .user(bob).type(DocumentType.RECEIPT).title("Otro")
                .status(DocumentStatus.ACTIVE).build());

        Specification<Document> spec = Specification
                .where(DocumentSpecifications.ownedBy(alice.getId()))
                .and(DocumentSpecifications.hasStatus(DocumentStatus.ACTIVE))
                .and(DocumentSpecifications.hasType(DocumentType.RECEIPT))
                .and(DocumentSpecifications.textMatches("MERCAD"));

        Page<Document> page = documentRepository.findAll(spec, PageRequest.of(0, 20));
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getTitle()).isEqualTo("Compra Mercadona");
    }

    @Test
    void null_filters_are_ignored() {
        assertThat(DocumentSpecifications.hasStatus(null)).isNull();
        assertThat(DocumentSpecifications.hasType(null)).isNull();
        assertThat(DocumentSpecifications.textMatches(null)).isNull();
        assertThat(DocumentSpecifications.textMatches("   ")).isNull();
    }

    @Test
    void textMatches_searches_storeName_too() {
        User u = userRepository.save(User.builder()
                .email("store-spec@x.com").name("store").passwordHash("p").role(Role.USER).build());
        documentRepository.save(Document.builder()
                .user(u).type(DocumentType.RECEIPT).title("X")
                .storeName("FerreteríaXYZ").status(DocumentStatus.ACTIVE).build());

        Specification<Document> spec = Specification
                .where(DocumentSpecifications.ownedBy(u.getId()))
                .and(DocumentSpecifications.textMatches("ferre"));

        Page<Document> page = documentRepository.findAll(spec, PageRequest.of(0, 20));
        assertThat(page.getContent()).hasSize(1);
    }
}
