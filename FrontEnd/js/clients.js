// DOM Elements
const clientTableBody = document.getElementById('clientTableBody');
const clientModal = document.getElementById('clientModal');
const clientForm = document.getElementById('clientForm');
const clientSearchInput = document.getElementById('clientSearchInput');
const clientSearchBtn = document.getElementById('clientSearchBtn');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load clients data
    fetchClients();
    
    // Add Client Button
    document.getElementById('addClientBtn').addEventListener('click', showAddClientModal);
    
    // Close Client Modal
    document.getElementById('closeClientModal').addEventListener('click', closeClientModal);
    document.getElementById('cancelClientBtn').addEventListener('click', closeClientModal);
    
    // Form Submission
    clientForm.addEventListener('submit', handleClientFormSubmit);
    
    // Search Functionality
    clientSearchBtn.addEventListener('click', handleClientSearch);
    clientSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleClientSearch();
        }
    });
});

// Functions - Clients
async function fetchClients() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch clients');
        }
        const clients = await response.json();
        displayClients(clients);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function displayClients(clients) {
    clientTableBody.innerHTML = '';
    
    if (clients.length === 0) {
        clientTableBody.appendChild(createNoDataRow('No clients found', 5));
        return;
    }
    
    clients.forEach(client => {
        const row = createClientRow(client);
        clientTableBody.appendChild(row);
    });
}

function createClientRow(client) {
    const row = document.createElement('tr');
    
    // Client ID column
    row.appendChild(createTableCell(`#${client.idClient}`));
    
    // Name column
    row.appendChild(createTableCell(`${client.firstName} ${client.lastName}`));
    
    // Email column
    row.appendChild(createTableCell(client.email || '-'));
    
    // Phone column
    row.appendChild(createTableCell(client.phone || '-'));
    
    // Actions column
    const actionsCell = createTableCell('', 'table-actions');
    
    const editButton = createButton('fas fa-edit', 'btn btn-sm btn-warning edit-client-btn', 
        () => showEditClientModal(client.idClient), { id: client.idClient });
    
    const deleteButton = createButton('fas fa-trash', 'btn btn-sm btn-danger delete-client-btn', 
        () => showDeleteConfirmation('client', client.idClient), { id: client.idClient });
    
    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);
    
    return row;
}

function showAddClientModal() {
    document.getElementById('clientModalTitle').textContent = 'Add New Client';
    clientForm.reset();
    document.getElementById('clientId').value = '';
    clientModal.classList.add('active');
}

async function showEditClientModal(id) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch client details');
        }
        const client = await response.json();
        
        document.getElementById('clientModalTitle').textContent = 'Edit Client';
        document.getElementById('clientId').value = client.idClient;
        document.getElementById('clientFirstName').value = client.firstName;
        document.getElementById('clientLastName').value = client.lastName;
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        
        clientModal.classList.add('active');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function closeClientModal() {
    clientModal.classList.remove('active');
}

async function handleClientFormSubmit(event) {
    event.preventDefault();
    
    const clientData = {
        firstName: document.getElementById('clientFirstName').value,
        lastName: document.getElementById('clientLastName').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value
    };
    
    const id = document.getElementById('clientId').value;
    const isEditing = id !== '';
    
    showLoading();
    try {
        let response;
        
        if (isEditing) {
            // Update existing client
            clientData.idClient = parseInt(id);
            response = await fetch(`${API_BASE_URL}/clients/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });
        } else {
            // Create new client
            response = await fetch(`${API_BASE_URL}/clients`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });
        }
        
        if (!response.ok) {
            throw new Error(`Failed to ${isEditing ? 'update' : 'create'} client`);
        }
        
        const result = await response.text();
        showSuccess(result);
        closeClientModal();
        fetchClients();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleClientSearch() {
    const searchTerm = clientSearchInput.value.trim();
    
    if (searchTerm === '') {
        fetchClients();
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/clients/search?term=${encodeURIComponent(searchTerm)}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to search clients');
        }
        const clients = await response.json();
        displayClients(clients);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}