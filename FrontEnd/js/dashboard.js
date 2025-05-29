// DOM Elements - Stats
const clientCount = document.getElementById('clientCount');
const dishCount = document.getElementById('dishCount');
const employeeCount = document.getElementById('employeeCount');
const orderCount = document.getElementById('orderCount');
const recentOrdersTableBody = document.getElementById('recentOrdersTableBody');
const orderDetailModal = document.getElementById('orderDetailModal');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard data
    fetchDashboardData();
    
    // Event listeners for order details modal
    document.getElementById('closeOrderDetailModal').addEventListener('click', closeOrderDetailModal);
    document.getElementById('closeOrderDetailBtn').addEventListener('click', closeOrderDetailModal);
});

// Fetch dashboard data
async function fetchDashboardData() {
    showLoading();
    try {
        // Fetch counts for each entity
        const [clientsResponse, dishesResponse, employeesResponse, ordersResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/clients`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            }),
            fetch(`${API_BASE_URL}/menu`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            }),
            fetch(`${API_BASE_URL}/employees`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            }),
            fetch(`${API_BASE_URL}/orders`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
        ]);
        
        const clients = await clientsResponse.json();
        const dishes = await dishesResponse.json();
        const employees = await employeesResponse.json();
        const orders = await ordersResponse.json();
        
        // Update dashboard counts
        clientCount.textContent = Array.isArray(clients) ? clients.length : 0;
        dishCount.textContent = Array.isArray(dishes) ? dishes.length : 0;
        employeeCount.textContent = Array.isArray(employees) ? employees.length : 0;
        orderCount.textContent = Array.isArray(orders) ? orders.length : 0;
        
        // Make sure orders is an array before using slice
        if (!Array.isArray(orders)) {
            console.error('Orders data is not an array:', orders);
            recentOrdersTableBody.innerHTML = '';
            recentOrdersTableBody.appendChild(createNoDataRow('No orders found or invalid data format', 6));
            return;
        }
        
        // Display recent orders (limit to 5)
        const recentOrders = orders.slice(0, 5);
        
        // Get customer names for each order
        const customerIds = recentOrders.map(order => order.idCustomer);
        const clientsById = {};
        
        if (Array.isArray(clients)) {
            clients.forEach(client => {
                clientsById[client.idClient] = `${client.firstName} ${client.lastName}`;
            });
        }
        
        // Populate recent orders table
        recentOrdersTableBody.innerHTML = '';
        
        if (recentOrders.length === 0) {
            recentOrdersTableBody.appendChild(createNoDataRow('No orders found', 6));
            return;
        }
        
        recentOrders.forEach(order => {
            const row = createRecentOrderRow(order, clientsById);
            recentOrdersTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        showError('Failed to load dashboard data: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Create recent order table row
function createRecentOrderRow(order, clientsById) {
    const row = document.createElement('tr');
    const orderDate = order.date ? new Date(order.date) : new Date();
    
    // Order ID column
    row.appendChild(createTableCell(`#${order.idOrder}`));
    
    // Customer column
    row.appendChild(createTableCell(clientsById[order.idCustomer] || 'Unknown'));
    
    // Date column
    row.appendChild(createTableCell(orderDate.toLocaleDateString()));
    
    // Status column
    const statusCell = createTableCell('', '');
    const statusSpan = createElement('span', {
        className: `status-label status-${(order.status || 'pending').toLowerCase()}`,
        textContent: order.status || 'Pending'
    });
    statusCell.appendChild(statusSpan);
    row.appendChild(statusCell);
    
    // Total column (placeholder value)
    row.appendChild(createTableCell('$120.00'));
    
    // Actions column
    const actionsCell = createTableCell('', 'table-actions');
    const viewButton = createButton('fas fa-eye', 'btn btn-sm btn-primary view-order-btn', 
        () => showOrderDetails(order.idOrder), { id: order.idOrder });
    actionsCell.appendChild(viewButton);
    row.appendChild(actionsCell);
    
    return row;
}

// Show order details
// Show order details
async function showOrderDetails(id) {
    showLoading();
    try {
        // Fetch order details
        const orderResponse = await fetch(`${API_BASE_URL}/orders/${id}`);
        if (!orderResponse.ok) {
            throw new Error('Failed to fetch order details');
        }
        const order = await orderResponse.json();
        
        // Fetch order items
        const orderItemsResponse = await fetch(`${API_BASE_URL}/order-details/order/${id}`);
        if (!orderItemsResponse.ok) {
            throw new Error('Failed to fetch order items');
        }
        const orderItems = await orderItemsResponse.json();
        
        // Fetch dish details for each item
        const dishes = await Promise.all(
            orderItems.map(item => 
                fetch(`${API_BASE_URL}/menu/${item.idDish}`)
                .then(response => response.json())
            )
        );
        
        // Fetch customer details
        const customerResponse = await fetch(`${API_BASE_URL}/clients/${order.idCustomer}`);
        const customer = await customerResponse.json();
        
        // Create and populate order items
        createOrderDetailsContent(order, orderItems, dishes, customer);
        
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
}