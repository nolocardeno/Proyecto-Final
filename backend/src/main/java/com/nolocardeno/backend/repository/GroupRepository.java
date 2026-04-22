package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.DocumentGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<DocumentGroup, Long> {

    List<DocumentGroup> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    List<DocumentGroup> findByMembersIdOrderByCreatedAtDesc(Long userId);

    Optional<DocumentGroup> findByAccessCode(String accessCode);

    boolean existsByDocumentsIdAndMembersId(Long documentId, Long userId);
}
