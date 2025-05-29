// DOM Elements
const orderTableBody = document.getElementById('orderTableBody');
const orderModal = document.getElementById('orderModal');
const orderDetailModal = document.getElementById('orderDetailModal');
const orderForm = document.getElementById('orderForm');
const orderSearchInput = document.getElementById('orderSearchInput');
const orderSearchBtn = document.getElementById('orderSearchBtn');

// Variables to track current operations
let currentOrderId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load orders data
    fetchOrders();
    
    // Add Order Button
    document.getElementById('addOrderBtn').addEventListener('click', showAddOrderModal);
    
    // Close Order Modals
    document.getElementById('closeOrderModal').addEventListener('click', closeOrderModal);
    document.getElementById('cancelOrderBtn').addEventListener('click', closeOrderModal);
    document.getElementById('closeOrderDetailModal').addEventListener('click', closeOrderDetailModal);
    document.getElementById('closeOrderDetailBtn').addEventListener('click', closeOrderDetailModal);
    
    // Form Submission
    orderForm.addEventListener('submit', handleOrderFormSubmit);
    
    // Search Functionality
    orderSearchBtn.addEventListener('click', handleOrderSearch);
    orderSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleOrderSearch();
        }
    });
    
    // Add Order Item
    document.getElementById('addOrderItemBtn').addEventListener('click', addOrderItemRow);
    
    // Update Order Status
    document.getElementById('updateOrderStatusBtn').addEventListener('click', showOrderStatusUpdateOptions);
});

// Functions - Orders
async function fetchOrders() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        const orders = await response.json();
        
        // Fetch clients to get names
        const clientsResponse = await fetch(`${API_BASE_URL}/clients`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const clients = await clientsResponse.json();
        
        // Create a map of client IDs to names
        const clientMap = {};
        clients.forEach(client => {
            clientMap[client.idClient] = `${client.firstName} ${client.lastName}`;
        });
        
        displayOrders(orders, clientMap);
        
        // Also populate the customer dropdown for new orders
        populateCustomerDropdown(clients);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function displayOrders(orders, clientMap) {
    orderTableBody.innerHTML = '';
    
    if (orders.length === 0) {
        orderTableBody.appendChild(createNoDataRow('No orders found', 5));
        return;
    }
    
    orders.forEach(order => {
        const row = createOrderRow(order, clientMap);
        orderTableBody.appendChild(row);
    });
}

function createOrderRow(order, clientMap) {
    const row = document.createElement('tr');
    const orderDate = new Date(order.date);
    
    // Order ID column
    row.appendChild(createTableCell(`#${order.idOrder}`));
    
    // Customer column
    row.appendChild(createTableCell(clientMap[order.idCustomer] || 'Unknown'));
    
    // Date column
    row.appendChild(createTableCell(orderDate.toLocaleDateString()));
    
    // Status column
    const statusCell = document.createElement('td');
    const statusSpan = createElement('span', {
        className: `status-label status-${order.status.toLowerCase()}`,
        textContent: order.status
    });
    statusCell.appendChild(statusSpan);
    row.appendChild(statusCell);
    
    // Actions column
    const actionsCell = createTableCell('', 'table-actions');
    
    const viewButton = createButton('fas fa-eye', 'btn btn-sm btn-primary view-order-btn', 
        () => showOrderDetails(order.idOrder), { id: order.idOrder });
    
    const editButton = createButton('fas fa-edit', 'btn btn-sm btn-warning edit-order-btn', 
        () => showEditOrderModal(order.idOrder), { id: order.idOrder });
    
    const deleteButton = createButton('fas fa-trash', 'btn btn-sm btn-danger delete-order-btn', 
        () => showDeleteConfirmation('order', order.idOrder), { id: order.idOrder });
    
    actionsCell.appendChild(viewButton);
    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);
    
    return row;
}

function populateCustomerDropdown(clients) {
    const customerSelect = document.getElementById('orderCustomer');
    customerSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = createElement('option', {
        attributes: { value: '' },
        textContent: 'Select a customer'
    });
    customerSelect.appendChild(defaultOption);
    
    clients.forEach(client => {
        const option = createElement('option', {
            attributes: { value: client.idClient },
            textContent: `${client.firstName} ${client.lastName}`
        });
        customerSelect.appendChild(option);
    });
}

function showAddOrderModal() {
    document.getElementById('orderModalTitle').textContent = 'Create New Order';
    orderForm.reset();
    document.getElementById('orderId').value = '';
    
    // Clear previous order items
    document.getElementById('orderItems').innerHTML = '';
    // Add first empty row
    addOrderItemRow();
    
    orderModal.classList.add('active');
}

async function showEditOrderModal(id) {
    showLoading();
    try {
        // Fetch order details
        const orderResponse = await fetch(`${API_BASE_URL}/orders/${id}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!orderResponse.ok) {
            throw new Error('Failed to fetch order details');
        }
        const order = await orderResponse.json();
        
        // Fetch order items
        const orderItemsResponse = await fetch(`${API_BASE_URL}/order-details/order/${id}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!orderItemsResponse.ok) {
            throw new Error('Failed to fetch order items');
        }
        const orderItems = await orderItemsResponse.json();
        
        // Set form values
        document.getElementById('orderModalTitle').textContent = 'Edit Order';
        document.getElementById('orderId').value = order.idOrder;
        document.getElementById('orderCustomer').value = order.idCustomer;
        document.getElementById('orderStatus').value = order.status;
        
        // Clear and populate order items
        const orderItemsContainer = document.getElementById('orderItems');
        orderItemsContainer.innerHTML = '';
        
        if (orderItems.length === 0) {
            // Add an empty row if no items
            addOrderItemRow();
        } else {
            // Add rows for each item
            orderItems.forEach(item => {
                addOrderItemRow(item);
            });
        }
        
        orderModal.classList.add('active');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function closeOrderModal() {
    orderModal.classList.remove('active');
}

function addOrderItemRow(item = null) {
    // Fetch dishes if needed for dropdown
    const dishesPromise = fetch(`${API_BASE_URL}/menu`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .catch(error => {
            showError('Failed to load dishes: ' + error.message);
            return [];
        });
    
    dishesPromise.then(dishes => {
        const orderItemsContainer = document.getElementById('orderItems');
        
        // Create row container
        const itemRow = createElement('div', {
            className: 'order-item-row',
            style: {
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 50px',
                gap: '10px',
                marginBottom: '10px',
                alignItems: 'center'
            }
        });
        
        // Create dish select
        const dishSelect = createElement('select', {
            className: 'form-control',
            attributes: { required: 'true' }
        });
        
        // Add default option
        const defaultOption = createElement('option', {
            attributes: { value: '' },
            textContent: 'Select a dish'
        });
        dishSelect.appendChild(defaultOption);
        
        // Add dish options
        dishes.forEach(dish => {
            const option = createElement('option', {
                attributes: { value: dish.idDish },
                textContent: `${dish.name} - ${dish.price.toFixed(2)}`,
                dataset: { price: dish.price }
            });
            dishSelect.appendChild(option);
        });
        
        // If editing, select the correct dish
        if (item) {
            dishSelect.value = item.idDish;
        }
        
        // Create quantity input
        const quantityInput = createElement('input', {
            attributes: {
                type: 'number',
                min: '1',
                required: 'true'
            },
            className: 'form-control',
            value: item ? item.quantity : '1'
        });
        
        // Create price input (readonly)
        const priceInput = createElement('input', {
            attributes: {
                type: 'number',
                readonly: 'true'
            },
            className: 'form-control',
            value: item ? item.price.toFixed(2) : ''
        });
        
        // Create remove button
        const removeBtn = createElement('button', {
            attributes: { type: 'button' },
            className: 'btn btn-danger btn-sm',
            innerHTML: '<i class="fas fa-times"></i>',
            events: {
                click: () => {
                    itemRow.remove();
                }
            }
        });
        
        // Event listener to update price when dish changes
        dishSelect.addEventListener('change', () => {
            const selectedOption = dishSelect.options[dishSelect.selectedIndex];
            if (selectedOption.dataset.price) {
                priceInput.value = parseFloat(selectedOption.dataset.price).toFixed(2);
            } else {
                priceInput.value = '';
            }
        });
        
        // Add elements to row
        itemRow.appendChild(dishSelect);
        itemRow.appendChild(quantityInput);
        itemRow.appendChild(priceInput);
        itemRow.appendChild(removeBtn);
        
        // Add row to container
        orderItemsContainer.appendChild(itemRow);
    });
}

async function handleOrderFormSubmit(event) {
    event.preventDefault();
    
    const orderId = document.getElementById('orderId').value;
    const customerId = document.getElementById('orderCustomer').value;
    const status = document.getElementById('orderStatus').value;
    
    if (!customerId) {
        showError('Please select a customer');
        return;
    }
    
    // Collect order items
    const orderItemRows = document.querySelectorAll('.order-item-row');
    const orderItems = [];
    
    orderItemRows.forEach(row => {
        const dishSelect = row.querySelector('select');
        const quantityInput = row.querySelectorAll('input')[0];
        const priceInput = row.querySelectorAll('input')[1];
        
        if (dishSelect.value && quantityInput.value) {
            orderItems.push({
                idDish: parseInt(dishSelect.value),
                quantity: parseInt(quantityInput.value),
                price: parseFloat(priceInput.value)
            });
        }
    });
    
    if (orderItems.length === 0) {
        showError('Please add at least one item to the order');
        return;
    }
    
    showLoading();
    try {
        // Create or update order
        const orderData = {
            idCustomer: parseInt(customerId),
            status: status,
            date: new Date().toISOString()
        };
        
        let orderResponse;
        let savedOrderId;
        
        if (orderId) {
            // Update existing order
            orderData.idOrder = parseInt(orderId);
            orderResponse = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!orderResponse.ok) {
                throw new Error('Failed to update order');
            }
            
            savedOrderId = orderId;
            
            // Delete existing order items
            const orderDetailsResponse = await fetch(`${API_BASE_URL}/order-details/order/${orderId}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            const existingItems = await orderDetailsResponse.json();
            
            // Delete each item
            for (const item of existingItems) {
                await fetch(`${API_BASE_URL}/order-details/${item.idDetail}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });
            }
        } else {
            // Create new order
            orderResponse = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!orderResponse.ok) {
                throw new Error('Failed to create order');
            }
            
            const orderResult = await orderResponse.text();
            // Assuming the response contains the new order ID
            savedOrderId = parseInt(orderResult.match(/\d+/)[0]);
        }
        
        // Create order items
        for (const item of orderItems) {
            const orderItemData = {
                idOrder: parseInt(savedOrderId),
                idDish: item.idDish,
                quantity: item.quantity,
                price: item.price
            };
            
            const itemResponse = await fetch(`${API_BASE_URL}/order-details`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderItemData)
            });
            
            if (!itemResponse.ok) {
                throw new Error('Failed to add order item');
            }
        }
        
        showSuccess(`Order ${orderId ? 'updated' : 'created'} successfully`);
        closeOrderModal();
        fetchOrders();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function showOrderDetails(id) {
    showLoading();
    try {
        // Fetch order details
        const orderResponse = await fetch(`${API_BASE_URL}/orders/${id}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!orderResponse.ok) {
            throw new Error('Failed to fetch order details');
        }
        const order = await orderResponse.json();
        
        // Fetch order items
        const orderItemsResponse = await fetch(`${API_BASE_URL}/order-details/order/${id}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!orderItemsResponse.ok) {
            throw new Error('Failed to fetch order items');
        }
        const orderItems = await orderItemsResponse.json();
        
        // Fetch dish details for each item
        const dishes = await Promise.all(
            orderItems.map(item => 
                fetch(`${API_BASE_URL}/menu/${item.idDish}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })
                .then(response => response.json())
            )
        );
        
        // Fetch customer details
        const customerResponse = await fetch(`${API_BASE_URL}/clients/${order.idCustomer}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const customer = await customerResponse.json();
        
        // Create and populate order items
        createOrderDetailsContent(order, orderItems, dishes, customer);
        
        // Set current order ID for status updates
        currentOrderId = order.idOrder;
        
        // Set the current status in the update button
        const updateOrderStatusBtn = document.getElementById('updateOrderStatusBtn');
        updateOrderStatusBtn.textContent = `Update Status (${order.status})`;
        updateOrderStatusBtn.onclick = showOrderStatusUpdateOptions;
        
        orderDetailModal.classList.add('active');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function createOrderDetailsContent(order, orderItems, dishes, customer) {
    // Populate order items
    const orderDetailItems = document.getElementById('orderDetailItems');
    orderDetailItems.innerHTML = '';
    
    let total = 0;
    
    orderItems.forEach((item, index) => {
        const dish = dishes[index];
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        
        const itemElement = createElement('div', {
            className: 'order-item'
        });
        
        const detailsDiv = createElement('div', {
            className: 'order-item-details'
        });
        
        const nameDiv = createElement('div', {
            className: 'order-item-name',
            textContent: dish.name
        });
        
        const priceDiv = createElement('div', {
            className: 'order-item-price',
            textContent: `${item.price.toFixed(2)} x ${item.quantity}`
        });
        
        const totalDiv = createElement('div', {
            className: 'order-item-total',
            textContent: itemTotal.toFixed(2)
        });
        
        detailsDiv.appendChild(nameDiv);
        detailsDiv.appendChild(priceDiv);
        
        itemElement.appendChild(detailsDiv);
        itemElement.appendChild(totalDiv);
        
        orderDetailItems.appendChild(itemElement);
    });
    
    // Populate order summary
    const orderDetailSummary = document.getElementById('orderDetailSummary');
    const orderDate = new Date(order.date);
    
    // Create summary container
    const summaryContainer = createElement('div', {
        style: { marginBottom: '15px' }
    });
    
    // Create order ID line
    const orderIdLine = createElement('div', {
        style: { marginBottom: '5px' }
    });
    const orderIdStrong = createElement('strong', {
        textContent: `Order #${order.idOrder}`
    });
    orderIdLine.appendChild(orderIdStrong);
    
    // Create date line
    const dateLine = createElement('div', {
        style: { marginBottom: '5px' },
        textContent: `Date: ${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}`
    });
    
// Create customer line
const customerLine = createElement('div', {
    style: { marginBottom: '5px' },
    textContent: `Customer: ${customer.firstName} ${customer.lastName}`
});

// Create status line
const statusLine = createElement('div', {
    style: { marginBottom: '5px' }
});
statusLine.textContent = 'Status: ';
const statusSpan = createElement('span', {
    className: `status-label status-${order.status.toLowerCase()}`,
    textContent: order.status
});
statusLine.appendChild(statusSpan);

// Create order total
const totalDiv = createElement('div', {
    className: 'order-total',
    textContent: `Total: ${total.toFixed(2)}`
});

// Add all elements to summary container
summaryContainer.appendChild(orderIdLine);
summaryContainer.appendChild(dateLine);
summaryContainer.appendChild(customerLine);
summaryContainer.appendChild(statusLine);

// Clear previous content and add new content
orderDetailSummary.innerHTML = '';
orderDetailSummary.appendChild(summaryContainer);
orderDetailSummary.appendChild(totalDiv);
}

function closeOrderDetailModal() {
    orderDetailModal.classList.remove('active');
    currentOrderId = null;
}

function showOrderStatusUpdateOptions() {
    const statusOptions = ['Pending', 'Processing', 'Completed', 'Cancelled'];
    
    // Create status options container
    const orderStatusContainer = createElement('div', {
        style: {
            position: 'absolute',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden',
            zIndex: '1100'
        }
    });
    
    // Position relative to the button
    const button = document.getElementById('updateOrderStatusBtn');
    const buttonRect = button.getBoundingClientRect();
    orderStatusContainer.style.top = `${buttonRect.bottom + 5}px`;
    orderStatusContainer.style.right = `${window.innerWidth - buttonRect.right}px`;
    
    // Create option elements
    statusOptions.forEach(status => {
        const statusOption = createElement('div', {
            textContent: status,
            style: {
                padding: '10px 15px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
            },
            events: {
                mouseover: (e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                },
                mouseout: (e) => {
                    e.target.style.backgroundColor = 'white';
                },
                click: () => {
                    updateOrderStatus(status);
                    document.body.removeChild(orderStatusContainer);
                }
            }
        });
        
        orderStatusContainer.appendChild(statusOption);
    });
    
    document.body.appendChild(orderStatusContainer);
    
    // Close when clicking outside
    const closeStatusOptions = (event) => {
        if (!orderStatusContainer.contains(event.target) && event.target !== button) {
            document.body.removeChild(orderStatusContainer);
            document.removeEventListener('click', closeStatusOptions);
        }
    };
    
    // Delay adding the event listener to prevent immediate closure
    setTimeout(() => {
        document.addEventListener('click', closeStatusOptions);
    }, 100);
}

async function updateOrderStatus(status) {
    if (!currentOrderId) return;
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${currentOrderId}/status?status=${status}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to update order status');
        }
        
        showSuccess(`Order status updated to ${status}`);
        closeOrderDetailModal();
        fetchOrders();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleOrderSearch() {
    const searchTerm = orderSearchInput.value.trim();
    
    if (searchTerm === '') {
        fetchOrders();
        return;
    }
    
    showLoading();
    try {
        const clientsResponse = await fetch(`${API_BASE_URL}/clients`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const clients = await clientsResponse.json();
        
        // Create a map of client IDs to names
        const clientMap = {};
        clients.forEach(client => {
            clientMap[client.idClient] = `${client.firstName} ${client.lastName}`;
        });
        
        // Fetch all orders and filter in JavaScript
        // This is a workaround if the API doesn't support searching orders
        const response = await fetch(`${API_BASE_URL}/orders`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        const filteredOrders = orders.filter(order => {
            // Check if order ID contains search term
            if (order.idOrder.toString().includes(searchTerm)) {
                return true;
            }
            
            // Check if customer name contains search term
            const customerName = clientMap[order.idCustomer] || '';
            if (customerName.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }
            
            // Check if status contains search term
            if (order.status.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }
            
            return false;
        });
        
        displayOrders(filteredOrders, clientMap);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}