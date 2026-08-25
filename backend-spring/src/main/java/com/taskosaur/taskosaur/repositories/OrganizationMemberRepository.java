package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, String> {
    List<OrganizationMember> findByUserId(String userId);
    Optional<OrganizationMember> findByUserIdAndOrganizationId(String userId, String organizationId);
    boolean existsByUserIdAndOrganizationId(String userId, String organizationId);
    List<OrganizationMember> findByOrganizationId(String organizationId);
    long countByOrganizationId(String organizationId);
}
