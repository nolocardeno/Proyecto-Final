package com.nolocardeno.backend.repository.spec;

import com.nolocardeno.backend.model.Document;
import com.nolocardeno.backend.model.enums.DocumentStatus;
import com.nolocardeno.backend.model.enums.DocumentType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Specifications reutilizables para construir consultas dinámicas sobre
 * {@link Document}. Combinables con {@code Specification.where(...).and(...)}.
 */
public final class DocumentSpecifications {

    private DocumentSpecifications() { }

    public static Specification<Document> ownedBy(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Document> hasStatus(DocumentStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Document> hasType(DocumentType type) {
        if (type == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }

    /**
     * Búsqueda libre case-insensitive sobre {@code title} y {@code storeName}.
     */
    public static Specification<Document> textMatches(String q) {
        if (q == null || q.isBlank() || q.length() > 255) {
            return null;
        }
        String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> {
            List<Predicate> ors = new ArrayList<>();
            ors.add(cb.like(cb.lower(root.get("title")), like));
            ors.add(cb.like(cb.lower(root.get("storeName")), like));
            return cb.or(ors.toArray(Predicate[]::new));
        };
    }
}
