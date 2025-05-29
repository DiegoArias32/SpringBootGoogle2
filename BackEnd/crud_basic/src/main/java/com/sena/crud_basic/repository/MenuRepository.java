package com.sena.crud_basic.repository;

import com.sena.crud_basic.model.DishDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<DishDTO, Integer> {
    
    // Method to search dishes by name or description
    List<DishDTO> findByNameContainingOrDescriptionContaining(String name, String description);
}
