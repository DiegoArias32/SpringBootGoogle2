package com.sena.crud_basic.service;

import com.sena.crud_basic.model.ClientDTO;
import com.sena.crud_basic.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    public String saveClient(ClientDTO client) {
        clientRepository.save(client);
        return "Record saved successfully";
    }

    public List<ClientDTO> getAllClients() {
        return clientRepository.findAll();
    }

    public Optional<ClientDTO> getClientById(Long id) {  // Changed to Long
        return clientRepository.findById(id);
    }

    public String updateClient(Long id, ClientDTO client) {  // Changed to Long
        if (clientRepository.existsById(id)) {
            client.setIdClient(id);  // Ensure the id is set correctly
            clientRepository.save(client);
            return "Client updated successfully";
        }
        return "Client not found";
    }

    public String deleteClient(Long id) {  // Changed to Long
        if (clientRepository.existsById(id)) {
            clientRepository.deleteById(id);
            return "Client deleted successfully";
        }
        return "Client not found";
    }

    public List<ClientDTO> searchClients(String searchTerm) {
        return clientRepository.searchClients(searchTerm);
    }
}
