package com.nolocardeno.backend.repository;

import com.nolocardeno.backend.model.DocumentGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<DocumentGroup, Long> {

    List<DocumentGroup> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    List<DocumentGroup> findByMembersIdOrderByCreatedAtDesc(Long userId);
}
