package com.sena.crud_basic.controller;

import com.sena.crud_basic.model.OrderDTO;
import com.sena.crud_basic.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*", 
             maxAge = 3600, 
             allowCredentials = "false")  // Cambiar a false para permitir cualquier origen
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<String> createOrder(@Valid @RequestBody OrderDTO order) {
        String result = orderService.saveOrder(order);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable int id) {
        OrderDTO order = orderService.getOrderById(id);
        if (order != null) {
            return ResponseEntity.ok(order);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<OrderDTO>> getOrdersByCustomer(@PathVariable int customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<String> updateOrder(@PathVariable int id, @Valid @RequestBody OrderDTO order) {
        order.setIdOrder(id);
        String result = orderService.updateOrder(order);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<String> updateOrderStatus(@PathVariable int id, @RequestParam String status) {
        String result = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteOrder(@PathVariable int id) {
        String result = orderService.deleteOrder(id);
        return ResponseEntity.ok(result);
    }
}