package com.sena.crud_basic.repository;

import com.sena.crud_basic.model.ClientDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<ClientDTO, Long> {  // Changed to Long

    // Custom query method to search clients by first name, last name, or email
    @Query("SELECT c FROM client c WHERE " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<ClientDTO> searchClients(@Param("searchTerm") String searchTerm);
}
