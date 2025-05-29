// DOM Elements
const dishTableBody = document.getElementById('dishTableBody');
const dishGrid = document.getElementById('dishGrid');
const dishModal = document.getElementById('dishModal');
const dishForm = document.getElementById('dishForm');
const dishSearchInput = document.getElementById('dishSearchInput');
const dishSearchBtn = document.getElementById('dishSearchBtn');
const tableViewBtn = document.getElementById('tableViewBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const dishTableView = document.getElementById('dishTableView');
const dishGridView = document.getElementById('dishGridView');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load dishes data
    fetchDishes();
    
    // Add Dish Button
    document.getElementById('addDishBtn').addEventListener('click', showAddDishModal);
    
    // Close Dish Modal
    document.getElementById('closeDishModal').addEventListener('click', closeDishModal);
    document.getElementById('cancelDishBtn').addEventListener('click', closeDishModal);
    
    // Form Submission
    dishForm.addEventListener('submit', handleDishFormSubmit);
    
    // Search Functionality
    dishSearchBtn.addEventListener('click', handleDishSearch);
    dishSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleDishSearch();
        }
    });
    
    // View Toggles
    tableViewBtn.addEventListener('click', showTableView);
    gridViewBtn.addEventListener('click', showGridView);
});

// Functions - Dishes
async function fetchDishes() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/menu`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch dishes');
        }
        const dishes = await response.json();
        displayDishes(dishes);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function displayDishes(dishes) {
    // Clear previous data
    dishTableBody.innerHTML = '';
    dishGrid.innerHTML = '';
    
    if (dishes.length === 0) {
        dishTableBody.appendChild(createNoDataRow('No dishes found', 5));
        return;
    }
    
    // Populate table view
    dishes.forEach(dish => {
        const row = createDishTableRow(dish);
        dishTableBody.appendChild(row);
    });
    
    // Populate grid view
    dishes.forEach(dish => {
        const gridItem = createDishGridItem(dish);
        dishGrid.appendChild(gridItem);
    });
}

function createDishTableRow(dish) {
    const row = document.createElement('tr');
    
    // Dish ID column
    row.appendChild(createTableCell(`#${dish.idDish}`));
    
    // Name column
    row.appendChild(createTableCell(dish.name));
    
    // Description column
    row.appendChild(createTableCell(dish.description));
    
    // Price column
    row.appendChild(createTableCell(dish.price.toFixed(2)));
    
    // Actions column
    const actionsCell = createTableCell('', 'table-actions');
    
    const editButton = createButton('fas fa-edit', 'btn btn-sm btn-warning edit-dish-btn', 
        () => showEditDishModal(dish.idDish), { id: dish.idDish });
    
    const deleteButton = createButton('fas fa-trash', 'btn btn-sm btn-danger delete-dish-btn', 
        () => showDeleteConfirmation('dish', dish.idDish), { id: dish.idDish });
    
    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);
    
    return row;
}

function createDishGridItem(dish) {
    const gridItem = createElement('div', {
        className: 'menu-item'
    });
    
    // Header with dish name
    const headerDiv = createElement('div', {
        className: 'menu-item-header'
    });
    
    const nameHeading = createElement('h3', {
        className: 'menu-item-name',
        textContent: dish.name
    });
    
    headerDiv.appendChild(nameHeading);
    gridItem.appendChild(headerDiv);
    
    // Content with description, price, and actions
    const contentDiv = createElement('div', {
        className: 'menu-item-content'
    });
    
    const descriptionPara = createElement('p', {
        className: 'menu-item-description',
        textContent: dish.description
    });
    
    const pricePara = createElement('p', {
        className: 'menu-item-price',
        textContent: dish.price.toFixed(2)
    });
    
    const actionsDiv = createElement('div', {
        className: 'menu-item-actions'
    });
    
    // Edit button with text
    const editButton = createElement('button', {
        className: 'btn btn-sm btn-warning edit-dish-btn',
        dataset: { id: dish.idDish },
        events: {
            click: () => showEditDishModal(dish.idDish)
        }
    });
    
    editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
    
    // Delete button with text
    const deleteButton = createElement('button', {
        className: 'btn btn-sm btn-danger delete-dish-btn',
        dataset: { id: dish.idDish },
        events: {
            click: () => showDeleteConfirmation('dish', dish.idDish)
        }
    });
    
    deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
    
    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(deleteButton);
    
    contentDiv.appendChild(descriptionPara);
    contentDiv.appendChild(pricePara);
    contentDiv.appendChild(actionsDiv);
    
    gridItem.appendChild(contentDiv);
    
    return gridItem;
}

function showTableView() {
    tableViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
    dishTableView.style.display = 'block';
    dishGridView.style.display = 'none';
}

function showGridView() {
    gridViewBtn.classList.add('active');
    tableViewBtn.classList.remove('active');
    dishGridView.style.display = 'block';
    dishTableView.style.display = 'none';
}

function showAddDishModal() {
    document.getElementById('dishModalTitle').textContent = 'Add New Dish';
    dishForm.reset();
    document.getElementById('dishId').value = '';
    dishModal.classList.add('active');
}

async function showEditDishModal(id) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch dish details');
        }
        const dish = await response.json();
        
        document.getElementById('dishModalTitle').textContent = 'Edit Dish';
        document.getElementById('dishId').value = dish.idDish;
        document.getElementById('dishName').value = dish.name;
        document.getElementById('dishDescription').value = dish.description;
        document.getElementById('dishPrice').value = dish.price;
        
        dishModal.classList.add('active');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function closeDishModal() {
    dishModal.classList.remove('active');
}

async function handleDishFormSubmit(event) {
    event.preventDefault();
    
    const dishData = {
        name: document.getElementById('dishName').value,
        description: document.getElementById('dishDescription').value,
        price: parseFloat(document.getElementById('dishPrice').value)
    };
    
    const id = document.getElementById('dishId').value;
    const isEditing = id !== '';
    
    showLoading();
    try {
        let response;
        
        if (isEditing) {
            // Update existing dish
            dishData.idDish = parseInt(id);
            response = await fetch(`${API_BASE_URL}/menu/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dishData)
            });
        } else {
            // Create new dish
            response = await fetch(`${API_BASE_URL}/menu`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dishData)
            });
        }
        
        if (!response.ok) {
            throw new Error(`Failed to ${isEditing ? 'update' : 'create'} dish`);
        }
        
        const result = await response.text();
        showSuccess(result);
        closeDishModal();
        fetchDishes();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleDishSearch() {
    const searchTerm = dishSearchInput.value.trim();
    
    if (searchTerm === '') {
        fetchDishes();
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/menu/search?term=${encodeURIComponent(searchTerm)}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to search dishes');
        }
        const dishes = await response.json();
        displayDishes(dishes);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}