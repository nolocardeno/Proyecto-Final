package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import com.nolocardeno.backend.model.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test de integración del repositorio de documentos.
 *
 * <p>Usa el perfil {@code test} (H2 en memoria, Hibernate crea/destruye el
 * esquema). Cada test se envuelve en una transacción que se revierte para
 * aislar datos entre tests.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DocumentRepositoryTest {

    @Autowired UserRepository userRepository;
    @Autowired DocumentRepository documentRepository;

    @Test
    void findByUserIdOrderByCreatedAtDesc_returns_only_user_documents() {
        User alice = saveUser("alice@x.com");
        User bob   = saveUser("bob@x.com");

        saveDoc(alice, "DNI Alice", DocumentType.DNI, DocumentStatus.ACTIVE);
        saveDoc(alice, "Pasaporte Alice", DocumentType.PASSPORT, DocumentStatus.ACTIVE);
        saveDoc(bob,   "DNI Bob",   DocumentType.DNI, DocumentStatus.ACTIVE);

        List<Document> aliceDocs = documentRepository.findByUserIdOrderByCreatedAtDesc(alice.getId());

        assertThat(aliceDocs).hasSize(2);
        assertThat(aliceDocs).allMatch(d -> d.getUser().getId().equals(alice.getId()));
    }

    @Test
    void findByUserIdAndStatus_filters_by_status() {
        User alice = saveUser("alice2@x.com");
        saveDoc(alice, "Activo",   DocumentType.DNI, DocumentStatus.ACTIVE);
        saveDoc(alice, "Caducado", DocumentType.DNI, DocumentStatus.EXPIRED);

        List<Document> active = documentRepository.findByUserIdAndStatus(
                alice.getId(), DocumentStatus.ACTIVE);

        assertThat(active).hasSize(1);
        assertThat(active.get(0).getTitle()).isEqualTo("Activo");
    }

    @Test
    void findByExpiryDateBeforeAndStatusNot_finds_expiring_docs() {
        User alice = saveUser("alice3@x.com");
        Document soon = Document.builder()
                .user(alice)
                .type(DocumentType.DNI)
                .title("Caduca pronto")
                .status(DocumentStatus.ACTIVE)
                .expiryDate(LocalDate.now().minusDays(1))
                .build();
        documentRepository.save(soon);

        List<Document> expiring = documentRepository.findByExpiryDateBeforeAndStatusNot(
                LocalDate.now(), DocumentStatus.EXPIRED);

        assertThat(expiring).extracting(Document::getTitle).contains("Caduca pronto");
    }

    private User saveUser(String email) {
        return userRepository.save(User.builder()
                .email(email)
                .passwordHash("x")
                .name(email)
                .role(Role.USER)
                .build());
    }

    private Document saveDoc(User u, String title, DocumentType type, DocumentStatus status) {
        return documentRepository.save(Document.builder()
                .user(u)
                .type(type)
                .title(title)
                .status(status)
                .build());
    }
}
