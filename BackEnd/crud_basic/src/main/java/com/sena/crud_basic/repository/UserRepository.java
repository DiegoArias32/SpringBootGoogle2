package com.sena.crud_basic.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.sena.crud_basic.model.UserDTO;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserDTO, Long> {
    Optional<UserDTO> findByUsername(String username);
    
    Optional<UserDTO> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);
    
    @Modifying
    @Transactional
    @Query("UPDATE UserDTO u SET u.failedAttempt = ?1 WHERE u.username = ?2")
    void updateFailedAttempts(int failedAttempts, String username);
    
    @Modifying
    @Transactional
    @Query("UPDATE UserDTO u SET u.accountNonLocked = ?1 WHERE u.username = ?2")
    void updateAccountLockStatus(boolean locked, String username);
}