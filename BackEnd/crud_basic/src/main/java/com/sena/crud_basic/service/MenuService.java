package com.sena.crud_basic.service;

import com.sena.crud_basic.model.DishDTO;
import com.sena.crud_basic.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MenuService {

    @Autowired
    private MenuRepository menuRepository;

    public String saveDish(DishDTO dish) {
        try {
            menuRepository.save(dish);
            return "Dish saved successfully";
        } catch (Exception e) {
            return "Error saving the dish: " + e.getMessage();
        }
    }

    public List<DishDTO> getAllDishes() {
        return menuRepository.findAll();
    }

    public DishDTO getDishById(int id) {
        Optional<DishDTO> dish = menuRepository.findById(id);
        return dish.orElse(null);
    }

    public String updateDish(DishDTO dish) {
        if (menuRepository.existsById(dish.getIdDish())) {
            try {
                menuRepository.save(dish);
                return "Dish updated successfully";
            } catch (Exception e) {
                return "Error updating the dish: " + e.getMessage();
            }
        } else {
            return "Dish not found with ID: " + dish.getIdDish();
        }
    }

    public String deleteDish(int id) {
        if (menuRepository.existsById(id)) {
            try {
                menuRepository.deleteById(id);
                return "Dish deleted successfully";
            } catch (Exception e) {
                return "Error deleting the dish: " + e.getMessage();
            }
        } else {
            return "Dish not found with ID: " + id;
        }
    }

    public List<DishDTO> searchDishes(String term) {
        return menuRepository.findByNameContainingOrDescriptionContaining(term, term);
    }
}
