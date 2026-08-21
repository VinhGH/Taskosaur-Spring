package com.taskosaur.taskosaur.repositories;

import com.taskosaur.taskosaur.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.taskosaur.taskosaur.enums.Role;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Optional<User> findByRefreshToken(String refreshToken);

    boolean existsByRole(Role role);
}