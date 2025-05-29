package com.sena.crud_basic.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sena.crud_basic.model.ERole;
import com.sena.crud_basic.model.RoleDTO;

@Repository
public interface RoleRepository extends JpaRepository<RoleDTO, Integer> {
    Optional<RoleDTO> findByName(ERole name);
}