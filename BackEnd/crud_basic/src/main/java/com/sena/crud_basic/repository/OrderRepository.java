package com.sena.crud_basic.repository;

import com.sena.crud_basic.model.OrderDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderDTO, Integer> {
    
    // Method to find orders by customer ID
    List<OrderDTO> findByIdCustomer(Integer idCustomer);
    
    // Method to find orders by status
    List<OrderDTO> findByStatus(String status);
    
    // Method to find orders by customer ID and status
    List<OrderDTO> findByIdCustomerAndStatus(Integer idCustomer, String status);
}
