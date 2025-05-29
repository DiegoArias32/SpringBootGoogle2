// Wait for common.js to load
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const employeeTableBody = document.getElementById('employeeTableBody');
    const employeeModal = document.getElementById('employeeModal');
    const employeeForm = document.getElementById('employeeForm');
    const employeeSearchInput = document.getElementById('employeeSearchInput');
    const employeeSearchBtn = document.getElementById('employeeSearchBtn');
    
    // Initialize page
    initializeStaffPage();
    
    function initializeStaffPage() {
        // Check if needed functions from common.js are available
        if (typeof showLoading !== 'function' || typeof hideLoading !== 'function') {
            console.warn('Common functions not loaded yet. Retrying in 100ms...');
            setTimeout(initializeStaffPage, 100);
            return;
        }
        
        // Load employees data
        fetchEmployees();
        
        // Add Employee Button
        document.getElementById('addEmployeeBtn').addEventListener('click', showAddEmployeeModal);
        
        // Close Employee Modal
        document.getElementById('closeEmployeeModal').addEventListener('click', closeEmployeeModal);
        document.getElementById('cancelEmployeeBtn').addEventListener('click', closeEmployeeModal);
        
        // Form Submission
        employeeForm.addEventListener('submit', handleEmployeeFormSubmit);
        
        // Search Functionality
        employeeSearchBtn.addEventListener('click', handleEmployeeSearch);
        employeeSearchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                handleEmployeeSearch();
            }
        });
    }
    
    // Functions - Employees
    async function fetchEmployees() {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/employees`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }
            const employees = await response.json();
            displayEmployees(employees);
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
    
    function displayEmployees(employees) {
        employeeTableBody.innerHTML = '';
        
        if (employees.length === 0) {
            employeeTableBody.appendChild(createNoDataRow('No employees found', 5));
            return;
        }
        
        employees.forEach(employee => {
            const row = createEmployeeRow(employee);
            employeeTableBody.appendChild(row);
        });
    }
    
    function createEmployeeRow(employee) {
        const row = document.createElement('tr');
        
        // Employee ID column
        row.appendChild(createTableCell(`#${employee.idEmployee}`));
        
        // Name column
        row.appendChild(createTableCell(`${employee.firstName} ${employee.lastName}`));
        
        // Position column
        row.appendChild(createTableCell(employee.position));
        
        // Salary column
        row.appendChild(createTableCell(employee.salary.toFixed(2)));
        
        // Actions column
        const actionsCell = createTableCell('', 'table-actions');
        
        const editButton = createButton('fas fa-edit', 'btn btn-sm btn-warning edit-employee-btn', 
            () => showEditEmployeeModal(employee.idEmployee), { id: employee.idEmployee });
        
        const deleteButton = createButton('fas fa-trash', 'btn btn-sm btn-danger delete-employee-btn', 
            () => showDeleteConfirmation('employee', employee.idEmployee), { id: employee.idEmployee });
        
        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);
        
        return row;
    }
    
    function showAddEmployeeModal() {
        document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
        employeeForm.reset();
        document.getElementById('employeeId').value = '';
        employeeModal.classList.add('active');
    }
    
    async function showEditEmployeeModal(id) {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch employee details');
            }
    
            const employee = await response.json();
    
            document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
            document.getElementById('employeeId').value = employee.idEmployee;
            document.getElementById('firstName').value = employee.firstName;
            document.getElementById('lastName').value = employee.lastName;
            document.getElementById('position').value = employee.position;
            document.getElementById('salary').value = employee.salary;
    
            employeeModal.classList.add('active');
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
    
    function closeEmployeeModal() {
        employeeModal.classList.remove('active');
    }
    
    async function handleEmployeeFormSubmit(event) {
        event.preventDefault();
        
        const employeeData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            position: document.getElementById('position').value,
            salary: parseFloat(document.getElementById('salary').value)
        };
        
        const id = document.getElementById('employeeId').value;
        const isEditing = id !== '';
        
        showLoading();
        try {
            let response;
            
            if (isEditing) {
                // Update existing employee
                employeeData.idEmployee = parseInt(id);
                response = await fetch(`${API_BASE_URL}/employees/${id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(employeeData)
                });
            } else {
                // Create new employee
                response = await fetch(`${API_BASE_URL}/employees`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(employeeData)
                });
            }
            
            if (!response.ok) {
                throw new Error(`Failed to ${isEditing ? 'update' : 'create'} employee`);
            }
            
            const result = await response.text();
            showSuccess(result);
            closeEmployeeModal();
            fetchEmployees();
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
    
    async function handleEmployeeSearch() {
        const searchTerm = employeeSearchInput.value.trim();
        
        if (searchTerm === '') {
            fetchEmployees();
            return;
        }
        
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/employees/search?term=${encodeURIComponent(searchTerm)}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            if (!response.ok) {
                throw new Error('Failed to search employees');
            }
            const employees = await response.json();
            displayEmployees(employees);
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
});