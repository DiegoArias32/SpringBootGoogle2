// API base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Common DOM Elements
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');
const loadingSpinner = document.getElementById('loadingSpinner');
const toggleSidenavBtn = document.getElementById('toggleSidenav');
const sidenav = document.getElementById('sidenav');
const confirmationModal = document.getElementById('confirmationModal');

// Variables to track current operations
let currentDeleteId = null;
let currentDeleteType = null;

// Helper Functions

// Create DOM elements
function createElement(tag, properties = {}) {
    const element = document.createElement(tag);
    
    // Set properties
    if (properties.className) {
        element.className = properties.className;
    }
    
    if (properties.id) {
        element.id = properties.id;
    }
    
    if (properties.textContent) {
        element.textContent = properties.textContent;
    }
    
    if (properties.innerText) {
        element.innerText = properties.innerText;
    }
    
    if (properties.innerHTML) {
        element.innerHTML = properties.innerHTML;
    }
    
    if (properties.attributes) {
        for (const [key, value] of Object.entries(properties.attributes)) {
            element.setAttribute(key, value);
        }
    }
    
    if (properties.dataset) {
        for (const [key, value] of Object.entries(properties.dataset)) {
            element.dataset[key] = value;
        }
    }
    
    if (properties.style) {
        for (const [key, value] of Object.entries(properties.style)) {
            element.style[key] = value;
        }
    }
    
    if (properties.events) {
        for (const [event, handler] of Object.entries(properties.events)) {
            element.addEventListener(event, handler);
        }
    }
    
    if (properties.children) {
        properties.children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
    }
    
    return element;
}

// Create table cells
function createTableCell(content, className) {
    const cell = document.createElement('td');
    if (className) {
        cell.className = className;
    }
    
    if (typeof content === 'string' || typeof content === 'number') {
        cell.textContent = content;
    } else {
        cell.appendChild(content);
    }
    
    return cell;
}

// Create buttons
function createButton(icon, className, clickHandler, dataset = {}) {
    const button = createElement('button', {
        className: className,
        dataset: dataset,
        events: {
            click: clickHandler
        }
    });
    
    button.appendChild(createElement('i', { className: icon }));
    
    return button;
}

// Create a no data row for tables
function createNoDataRow(message, colSpan) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = message;
    cell.colSpan = colSpan;
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    return row;
}

// Show loading spinner
function showLoading() {
    loadingSpinner.classList.add('active');
}

// Hide loading spinner
function hideLoading() {
    loadingSpinner.classList.remove('active');
}

// Show success message
function showSuccess(message) {
    successAlert.textContent = message;
    successAlert.classList.add('active');
    
    setTimeout(() => {
        successAlert.classList.remove('active');
    }, 3000);
}

// Show error message
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.add('active');
    
    setTimeout(() => {
        errorAlert.classList.remove('active');
    }, 3000);
}

// Show delete confirmation modal
function showDeleteConfirmation(type, id) {
    currentDeleteType = type;
    currentDeleteId = id;
    
    let message;
    switch (type) {
        case 'employee':
            message = 'Are you sure you want to delete this employee? This action cannot be undone.';
            break;
        case 'dish':
            message = 'Are you sure you want to delete this dish? This action cannot be undone.';
            break;
        case 'client':
            message = 'Are you sure you want to delete this client? This action cannot be undone.';
            break;
        case 'order':
            message = 'Are you sure you want to delete this order? This action cannot be undone.';
            break;
        default:
            message = 'Are you sure you want to delete this item? This action cannot be undone.';
    }
    
    document.getElementById('confirmationMessage').textContent = message;
    confirmationModal.classList.add('active');
}

// Close confirmation modal
function closeConfirmModal() {
    confirmationModal.classList.remove('active');
    currentDeleteType = null;
    currentDeleteId = null;
}

// Initialize common event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    if (toggleSidenavBtn) {
        toggleSidenavBtn.addEventListener('click', () => {
            sidenav.classList.toggle('active');
        });
    }
    
    // Close confirmation modal
    document.getElementById('closeConfirmModal').addEventListener('click', closeConfirmModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeConfirmModal);
    
    // Set the active navigation link based on current page
    const currentPage = location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidenav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Confirm delete function (will be implemented in each page's JS)
async function confirmDelete() {
    if (!currentDeleteId || !currentDeleteType) return;
    
    showLoading();
    try {
        let url;
        let refreshFunction;
        
        switch (currentDeleteType) {
            case 'employee':
                url = `${API_BASE_URL}/employees/${currentDeleteId}`;
                refreshFunction = typeof fetchEmployees === 'function' ? fetchEmployees : null;
                break;
            case 'dish':
                url = `${API_BASE_URL}/menu/${currentDeleteId}`;
                refreshFunction = typeof fetchDishes === 'function' ? fetchDishes : null;
                break;
            case 'client':
                url = `${API_BASE_URL}/clients/${currentDeleteId}`;
                refreshFunction = typeof fetchClients === 'function' ? fetchClients : null;
                break;
            case 'order':
                url = `${API_BASE_URL}/orders/${currentDeleteId}`;
                refreshFunction = typeof fetchOrders === 'function' ? fetchOrders : null;
                break;
            default:
                throw new Error('Invalid delete type');
        }

        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete ${currentDeleteType}`);
        }

        const result = await response.text();
        showSuccess(result);
        closeConfirmModal();

        // Refresh the data if the function exists
        if (refreshFunction) {
            refreshFunction();
        }
        
        // Update dashboard if the function exists
        if (typeof fetchDashboardData === 'function') {
            fetchDashboardData();
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Add event listener for the confirmation button
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmDelete);
    }
});