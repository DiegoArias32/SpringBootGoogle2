package com.sena.crud_basic.controller;

import com.sena.crud_basic.model.DishDTO;
import com.sena.crud_basic.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = "*", 
             maxAge = 3600, 
             allowCredentials = "false")  // Cambiar a false para permitir cualquier origen
public class MenuController {

    @Autowired
    private MenuService menuService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<String> createDish(@Valid @RequestBody DishDTO dish) {
        String result = menuService.saveDish(dish);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<DishDTO>> getAllDishes() {
        return ResponseEntity.ok(menuService.getAllDishes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DishDTO> getDishById(@PathVariable int id) {
        DishDTO dish = menuService.getDishById(id);
        if (dish != null) {
            return ResponseEntity.ok(dish);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<String> updateDish(@PathVariable int id, @Valid @RequestBody DishDTO dish) {
        dish.setIdDish(id);
        String result = menuService.updateDish(dish);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteDish(@PathVariable int id) {
        String result = menuService.deleteDish(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/search")
    public ResponseEntity<List<DishDTO>> searchDishes(@RequestParam String term) {
        return ResponseEntity.ok(menuService.searchDishes(term));
    }
}