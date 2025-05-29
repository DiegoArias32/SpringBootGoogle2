package com.sena.crud_basic.repository;

import com.sena.crud_basic.model.OrderDetailDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetailDTO, Integer> {

    // Method to find order details by order ID
    List<OrderDetailDTO> findByIdOrder(Integer idOrder);

    // Method to find order details by dish ID
    List<OrderDetailDTO> findByIdDish(Integer idDish);

    // Method to find order details by order ID and dish ID
    OrderDetailDTO findByIdOrderAndIdDish(Integer idOrder, Integer idDish);
}
