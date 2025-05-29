package com.sena.crud_basic.service;

import com.sena.crud_basic.model.EmployeeDTO;
import com.sena.crud_basic.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    public String saveEmployee(EmployeeDTO employee) {
        try {
            employeeRepository.save(employee);
            return "Employee saved successfully";
        } catch (Exception e) {
            return "Error saving the employee: " + e.getMessage();
        }
    }

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public EmployeeDTO getEmployeeById(int id) {
        Optional<EmployeeDTO> employee = employeeRepository.findById(id);
        return employee.orElse(null);
    }

    public String updateEmployee(EmployeeDTO employee) {
        if (employeeRepository.existsById(employee.getIdEmployee())) {
            try {
                employeeRepository.save(employee);
                return "Employee updated successfully";
            } catch (Exception e) {
                return "Error updating the employee: " + e.getMessage();
            }
        } else {
            return "Employee not found with ID: " + employee.getIdEmployee();
        }
    }

    public String deleteEmployee(int id) {
        if (employeeRepository.existsById(id)) {
            try {
                employeeRepository.deleteById(id);
                return "Employee deleted successfully";
            } catch (Exception e) {
                return "Error deleting the employee: " + e.getMessage();
            }
        } else {
            return "Employee not found with ID: " + id;
        }
    }

    public List<EmployeeDTO> searchEmployees(String searchTerm) {
        return employeeRepository.findByFirstNameContainingOrLastNameContainingOrPositionContaining(
                searchTerm, searchTerm, searchTerm);
    }
}
