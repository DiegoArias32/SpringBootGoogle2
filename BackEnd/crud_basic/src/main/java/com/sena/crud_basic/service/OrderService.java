package com.sena.crud_basic.service;

import com.sena.crud_basic.model.OrderDTO;
import com.sena.crud_basic.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    public String saveOrder(OrderDTO order) {
        try {
            orderRepository.save(order);
            return "Order saved successfully";
        } catch (Exception e) {
            return "Error saving the order: " + e.getMessage();
        }
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll();
    }

    public OrderDTO getOrderById(int id) {
        Optional<OrderDTO> order = orderRepository.findById(id);
        return order.orElse(null);
    }

    public List<OrderDTO> getOrdersByCustomer(int idCustomer) {
        return orderRepository.findByIdCustomer(idCustomer);
    }

    public String updateOrder(OrderDTO order) {
        if (orderRepository.existsById(order.getIdOrder())) {
            try {
                orderRepository.save(order);
                return "Order updated successfully";
            } catch (Exception e) {
                return "Error updating the order: " + e.getMessage();
            }
        } else {
            return "Order with ID " + order.getIdOrder() + " not found";
        }
    }

    public String updateOrderStatus(int id, String status) {
        Optional<OrderDTO> optionalOrder = orderRepository.findById(id);
        
        if (optionalOrder.isPresent()) {
            try {
                OrderDTO order = optionalOrder.get();
                order.setStatus(status);
                orderRepository.save(order);
                return "Order status updated successfully";
            } catch (Exception e) {
                return "Error updating the order status: " + e.getMessage();
            }
        } else {
            return "Order with ID " + id + " not found";
        }
    }

    public String deleteOrder(int id) {
        if (orderRepository.existsById(id)) {
            try {
                orderRepository.deleteById(id);
                return "Order deleted successfully";
            } catch (Exception e) {
                return "Error deleting the order: " + e.getMessage();
            }
        } else {
            return "Order with ID " + id + " not found";
        }
    }
}
