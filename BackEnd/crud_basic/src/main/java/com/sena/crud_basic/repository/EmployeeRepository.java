package com.sena.crud_basic.repository;

import com.sena.crud_basic.model.EmployeeDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<EmployeeDTO, Integer> {
    
    // Method to search employees by first name, last name, or position
    List<EmployeeDTO> findByFirstNameContainingOrLastNameContainingOrPositionContaining(
            String firstName, String lastName, String position);
}
