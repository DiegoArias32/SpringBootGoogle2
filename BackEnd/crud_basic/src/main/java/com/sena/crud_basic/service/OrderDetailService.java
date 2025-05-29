package com.sena.crud_basic.service;

import com.sena.crud_basic.model.OrderDetailDTO;
import com.sena.crud_basic.repository.OrderDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderDetailService {

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    public String saveOrderDetail(OrderDetailDTO detail) {
        try {
            orderDetailRepository.save(detail);
            return "Order detail saved successfully";
        } catch (Exception e) {
            return "Error saving order detail: " + e.getMessage();
        }
    }

    public List<OrderDetailDTO> getOrderDetailsByOrderId(int orderId) {
        return orderDetailRepository.findByIdOrder(orderId);
    }

    public OrderDetailDTO getOrderDetailById(int id) {
        Optional<OrderDetailDTO> detail = orderDetailRepository.findById(id);
        return detail.orElse(null);
    }

    public String updateOrderDetail(OrderDetailDTO detail) {
        if (orderDetailRepository.existsById(detail.getIdDetail())) {
            try {
                orderDetailRepository.save(detail);
                return "Order detail updated successfully";
            } catch (Exception e) {
                return "Error updating order detail: " + e.getMessage();
            }
        } else {
            return "No order detail found with ID: " + detail.getIdDetail();
        }
    }

    public String deleteOrderDetail(int id) {
        if (orderDetailRepository.existsById(id)) {
            try {
                orderDetailRepository.deleteById(id);
                return "Order detail deleted successfully";
            } catch (Exception e) {
                return "Error deleting order detail: " + e.getMessage();
            }
        } else {
            return "No order detail found with ID: " + id;
        }
    }
}
