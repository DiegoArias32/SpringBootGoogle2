package com.sena.crud_basic.controller;

import com.sena.crud_basic.model.ClientDTO;
import com.sena.crud_basic.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = "*", 
             maxAge = 3600, 
             allowCredentials = "false")  // Cambiar a false para permitir cualquier origen
public class ClientController {

    @Autowired
    private ClientService clientService;

    @PostMapping

    public ResponseEntity<String> createClient(@Valid @RequestBody ClientDTO client) {
        String result = clientService.saveClient(client);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<ClientDTO>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<ClientDTO>> searchClients(@RequestParam String term) {
        return ResponseEntity.ok(clientService.searchClients(term));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Object> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<String> updateClient(
        @PathVariable Long id,
        @Valid @RequestBody ClientDTO client
    ) {
        String result = clientService.updateClient(id, client);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteClient(@PathVariable Long id) {
        String result = clientService.deleteClient(id);
        return ResponseEntity.ok(result);
    }
}