// FUNCTIONS TO UPDATE MENU ITEM PRICE 
document.addEventListener("DOMContentLoaded", function () {
    const priceDisplay = document.getElementById("current_price");
    const menuSelect = document.getElementById("menu_item");

    // When a menu item is selected, set its default price
    menuSelect.addEventListener("change", function () {
        let selectedOption = menuSelect.options[menuSelect.selectedIndex];
        let menuId = selectedOption.value;
        let price = parseFloat(selectedOption.dataset.price) || 0;

        priceDisplay.dataset.menuId = menuId; // Store the item ID
        priceDisplay.textContent = `₦${price.toLocaleString()}`;
        priceDisplay.dataset.originalPrice = price; // ✅ Store default price
    });

    // Handle price adjustment buttons
    document.querySelectorAll(".adjust-price").forEach(button => {
        button.addEventListener("click", function () {
            let menuId = priceDisplay.dataset.menuId;
            if (!menuId) {
                alert("Please select a menu item first!");
                return;
            }

            let changeAmount = parseInt(this.dataset.amount);
            updatePrice(menuId, changeAmount);
        });
    });

    function updatePrice(menuId, amount) {
        let currentPrice = parseFloat(priceDisplay.textContent.replace("₦", "").replace(",", ""));
        let newPrice = Math.max(0, currentPrice + amount);

        priceDisplay.textContent = `₦${newPrice.toLocaleString()}`;
    }

    // ✅ Ensure price is taken from the price display when adding to tray
    document.getElementById("addToTray").addEventListener("click", () => {
        let menuItemId = menuSelect.value;
        let menuItemText = menuSelect.selectedOptions[0]?.textContent || "";
        let specialInstructions = document.getElementById("special_instructions").value;
        
        // ✅ Get the updated price or default price if unchanged
        let displayedPrice = parseFloat(priceDisplay.textContent.replace("₦", "").replace(",", ""));
        let defaultPrice = parseFloat(priceDisplay.dataset.originalPrice) || 0;
        let finalPrice = displayedPrice > 0 ? displayedPrice : defaultPrice;

        if (!menuItemId || isNaN(finalPrice) || finalPrice <= 0) {
            alert("Please select a menu item and ensure the price is valid.");
            return;
        }

        addItemToTray(menuItemId, menuItemText, finalPrice, specialInstructions);
    });
});




// Function to fetch Guest ID by Room Number
function fetchGuestId() {
    const roomNumber = document.getElementById('room_number').value;

    if (!roomNumber) {
        alert("Please select a room number.");
        return;
    }

    fetch(`get_guest_id_by_room.php?room_number=${roomNumber}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Set the guest_id in a form input field
                document.getElementById('guest_id').value = data.guest_id;

                // Update the status message on the page
                document.getElementById('status').innerText = 'Guest ID found: ' + data.guest_id;
            } else {
                // If there's an error, clear the guest_id field and show the error message
                document.getElementById('guest_id').value = '';
                document.getElementById('status').innerText = 'Error: ' + data.error;
            }
        })
        .catch(error => {
            console.error('Error fetching guest ID:', error);
            document.getElementById('status').innerText = 'An error occurred.';
        });
}

// Update menu items based on category selection
document.getElementById('category').addEventListener('change', function () {
    const categoryId = this.value;
    updateMenuItems(categoryId);
});

function updateMenuItems(categoryId) {
    const menuSelect = document.getElementById('menu_item');
    menuSelect.innerHTML = '<option value="">-- Select Menu Item --</option>';

    if (menuItemsByCategory[categoryId]) {
        menuItemsByCategory[categoryId].forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (₦${parseFloat(item.price).toFixed(2)})`;
            menuSelect.appendChild(option);
        });
    }
}

// Order Tray Logic
const orderTray = [];
const orderTrayTable = document.getElementById("orderTray").querySelector("tbody");

document.getElementById("addToTray").addEventListener("click", () => {
    const menuItemId = document.getElementById("menu_item").value;
    const menuItemText = document.getElementById("menu_item").selectedOptions[0]?.textContent || "";
    const specialInstructions = document.getElementById("special_instructions").value;
    
    // ✅ Get the updated price from the display
    const updatedPrice = parseFloat(document.getElementById("current_price").textContent.replace("₦", "").replace(",", ""));

    if (!menuItemId || isNaN(updatedPrice)) {
        alert("Please select a menu item and ensure the price is valid.");
        return;
    }

    addItemToTray(menuItemId, menuItemText, updatedPrice, specialInstructions);
});

function addItemToTray(menuItemId, menuItemText, price, specialInstructions) {
    orderTray.push({ menuItemId, menuItemText, price, specialInstructions });

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${menuItemText}</td>
        <td>₦${price.toFixed(2)}</td>
        <td>${specialInstructions}</td>
        <td><button class="remove-item">Remove</button></td>
    `;
    orderTrayTable.appendChild(row);

    // Remove item from tray when clicking "Remove"
    row.querySelector(".remove-item").addEventListener("click", () => {
        orderTray.splice(orderTray.indexOf(menuItemId), 1);
        row.remove();
    });
}

// Submit Orders
document.getElementById('submitOrders').addEventListener('click', () => {
    if (!orderTray.length) {
        alert('The order tray is empty.');
        return;
    }

    const guestType = document.getElementById('guest_type').value;
    const guestId = document.getElementById('guest_id').value;
    const roomNumber = document.getElementById('room_number').value;

    if (guestType === 'guest' && (!guestId || !roomNumber)) {
        alert('Please ensure both guest ID and room number are selected.');
        return;
    }

    const orderData = {
        guestType,
        roomNumber: guestType === 'guest' ? roomNumber : null,
        guestId: guestType === 'guest' ? guestId : null,
        orders: orderTray,
        specialInstructions: document.getElementById('special_instructions').value
    };

    sendOrderToServer(orderData);
});

function sendOrderToServer(orderData) {
    fetch('submit_orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order submitted successfully!');
            orderTray.length = 0;
            orderTrayTable.innerHTML = ''; // Clear the table
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
}

// Mark Order as Completed
function markAsComplete(orderId) {
    fetch('kitchen.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `mark_completed=1&order_id=${orderId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'Completed') {
            const button = document.getElementById(`mark-completed-btn-${orderId}`);
            button.disabled = true;
            button.textContent = 'Completed';

            const statusElement = document.getElementById(`status-${orderId}`);
            if (statusElement) statusElement.textContent = 'Completed';
        } else {
            alert('Failed to mark as completed.');
        }
    })
    .catch(error => {
        console.error('Error updating order:', error);
        alert('Failed to update order status. Please try again.');
    });
}

// Fetch Orders
function fetchOrders() {
    $.ajax({
        url: 'fetch_orders.php',
        success: function(response) {
            $('#orders-table tbody').html(response);
        }
    });
}

// Order Summary Logic
let orders = [];
let totalAmount = 0;

function addOrderToSummary(item, price) {
    orders.push({ item, price });
    totalAmount += price;
    updateOrderSummary();
}

function updateOrderSummary() {
    const orderList = document.getElementById('orderList');
    const totalAmountElem = document.getElementById('totalAmount');

    orderList.innerHTML = '';
    orders.forEach(order => {
        const li = document.createElement('li');
        li.textContent = `${order.item} - ₦${order.price}`;
        orderList.appendChild(li);
    });

    totalAmountElem.textContent = totalAmount.toFixed(2);
}

// Clear All Orders
function clearAllOrders() {
    orders = [];
    totalAmount = 0;
    updateOrderSummary();
}

function loadDynamicContent() {
    // Your dynamic content loading logic here
    // After content is loaded, attach the event listener:

    const clearButton = document.getElementById('clearAllOrdersButton');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllOrders);
    }
}

// Call this function after the content is dynamically added
loadDynamicContent();

// Confirm Order and Send to Front Desk
function confirmOrder() {
    const roomNumber = document.getElementById('roomNumber').value;
    const specialInstructions = document.getElementById('specialInstructions').value;

    const data = { roomNumber, orders, totalAmount, specialInstructions };

    fetch('send_to_frontdesk.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(responseData => {
        if (responseData.success) {
            alert('Order sent successfully!');
            clearAllOrders();
        } else {
            alert('Failed to send order. Please try again.');
        }
    })
    .catch(error => console.error('Error:', error));
}

function loadDynamicContent() {
    // Your dynamic content loading logic here
    // After the form is added dynamically, attach the event listener:

    const addOrderForm = document.getElementById('add-order-form');
    if (addOrderForm) {
        addOrderForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let formData = new FormData(this);

            fetch('add_order.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Order added successfully!');
                    location.reload();
                } else {
                    alert('Failed to add order. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error occurred. Please try again.');
            });
        });
    }
}

// Call this function after the content is dynamically added
loadDynamicContent();
