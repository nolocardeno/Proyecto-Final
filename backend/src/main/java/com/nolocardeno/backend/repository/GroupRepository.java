package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.DocumentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<DocumentGroup, Long> {

    List<DocumentGroup> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    List<DocumentGroup> findByMembersIdOrderByCreatedAtDesc(Long userId);

    Optional<DocumentGroup> findByAccessCode(String accessCode);

    boolean existsByDocumentsIdAndMembersId(Long documentId, Long userId);

    @Modifying
    @Query(value = "DELETE FROM group_documents WHERE document_id = :documentId", nativeQuery = true)
    void removeDocumentFromAllGroups(@Param("documentId") Long documentId);
}
