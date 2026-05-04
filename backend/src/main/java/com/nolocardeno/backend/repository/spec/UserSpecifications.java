package com.nolocardeno.backend.repository.spec;

import com.nolocardeno.backend.model.User;
import com.nolocardeno.backend.model.enums.Role;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

public final class UserSpecifications {

    private UserSpecifications() { }

    public static Specification<User> hasRole(Role role) {
        if (role == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("role"), role);
    }

    /** Búsqueda libre sobre email y nombre. */
    public static Specification<User> textMatches(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> {
            Predicate emailMatch = cb.like(cb.lower(root.get("email")), like);
            Predicate nameMatch = cb.like(cb.lower(root.get("name")), like);
            return cb.or(emailMatch, nameMatch);
        };
    }
}
