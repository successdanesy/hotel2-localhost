<?php
session_start();
include('db_connect.php');

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $guestType = $data['guestType'];
        $roomNumber = $data['roomNumber'] ?? null;
        $orders = $data['orders'];
        $specialInstructions = $data['specialInstructions'];
        $guestId = $data['guestId'] ?? null;

        if (!is_array($orders) || empty($orders)) {
            throw new Exception('No orders received.');
        }

        foreach ($orders as $order) {
            $menuItemId = $order['menuItemId'];
            $menuItemText = $order['menuItemText'];
            $price = $order['price']; // ✅ Now using the updated price!

            // Insert order into the database
            $query = "INSERT INTO kitchen_orders 
          (room_number, order_description, status, timestamp, total_amount, special_instructions, guest_id, guest_type) 
          VALUES (?, ?, 'Pending', NOW(), ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ssdsds", $roomNumber, $menuItemText, $price, $specialInstructions, $guestId, $guestType);


            if (!$stmt->execute()) {
                throw new Exception('Failed to add the order: ' . $stmt->error);
            }
            $stmt->close();
        }

        echo json_encode(['success' => true, 'message' => 'Orders submitted successfully!']);
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
