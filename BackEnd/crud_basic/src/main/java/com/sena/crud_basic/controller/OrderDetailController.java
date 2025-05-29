package com.sena.crud_basic.controller;

import com.sena.crud_basic.model.OrderDetailDTO;
import com.sena.crud_basic.service.OrderDetailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order-details")
@CrossOrigin(origins = "*", 
             maxAge = 3600, 
             allowCredentials = "false")  // Cambiar a false para permitir cualquier origen
public class OrderDetailController {

    @Autowired
    private OrderDetailService orderDetailService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<String> createOrderDetail(@Valid @RequestBody OrderDetailDTO orderDetail) {
        String result = orderDetailService.saveOrderDetail(orderDetail);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<OrderDetailDTO>> getDetailsByOrder(@PathVariable int orderId) {
        return ResponseEntity.ok(orderDetailService.getOrderDetailsByOrderId(orderId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<OrderDetailDTO> getOrderDetailById(@PathVariable int id) {
        OrderDetailDTO orderDetail = orderDetailService.getOrderDetailById(id);
        if (orderDetail != null) {
            return ResponseEntity.ok(orderDetail);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<String> updateOrderDetail(@PathVariable int id, @Valid @RequestBody OrderDetailDTO orderDetail) {
        orderDetail.setIdDetail(id);
        String result = orderDetailService.updateOrderDetail(orderDetail);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteOrderDetail(@PathVariable int id) {
        String result = orderDetailService.deleteOrderDetail(id);
        return ResponseEntity.ok(result);
    }
}