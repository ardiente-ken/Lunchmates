import Order from "../model/orderModel.js";

/**
 * Submit or update today's order
 */
export const submitOrder = async (req, res) => {
    try {
        const { userId, items } = req.body;
        if (!userId) return res.status(400).json({ message: "Missing userId" });
        if (!items || !items.length) return res.status(400).json({ message: "No items provided" });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let order = await Order.findOne({
            oh_userID: userId,
            oh_orderDate: { $gte: todayStart, $lte: todayEnd },
        });

        if (!order) {
            // 🆕 Create new order
            order = new Order({
                oh_userID: userId,
                oh_orderDate: new Date(),
                items: items,
                oh_totalAmount: items.reduce((sum, i) => sum + i.price * i.qty, 0),
            });
            await order.save();
            console.log("🆕 New order created");
            return res.status(201).json({ message: "Order created successfully", order });
        }

        // 🔁 Update existing order (merge items)
        const existingItems = order.items.map(i => i.name);
        for (const newItem of items) {
            const existingIndex = order.items.findIndex(i => i.name === newItem.name);
            if (existingIndex > -1) {
                // Update qty and price
                order.items[existingIndex].qty = newItem.qty;
                order.items[existingIndex].price = newItem.price;
            } else {
                // Add new item
                order.items.push(newItem);
            }
        }

        // Remove items with qty = 0
        order.items = order.items.filter(i => i.qty > 0);

        // Recalculate total
        order.oh_totalAmount = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
        await order.save();

        console.log("✏️ Order updated successfully");
        res.status(200).json({ message: "Order updated successfully", order });
    } catch (err) {
        console.error("❌ Error submitting order:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * Get today's order for a specific user
 */
export const getTodaysOrder = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ message: "Missing userId" });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const order = await Order.findOne({
            oh_userID: userId,
            oh_orderDate: { $gte: todayStart, $lte: todayEnd },
        }).populate("oh_userID", "um_firstname um_lastname um_username");

        if (!order) return res.status(404).json({ message: "No order found for today" });
        res.status(200).json(order);
    } catch (err) {
        console.error("❌ Error fetching today's order:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * Delete or cancel today's order
 */
export const cancelOrder = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ message: "Missing userId" });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const deleted = await Order.deleteOne({
            oh_userID: userId,
            oh_orderDate: { $gte: todayStart, $lte: todayEnd },
        });

        if (!deleted.deletedCount) {
            return res.status(404).json({ message: "No order found to delete" });
        }

        console.log("🗑️ Order deleted");
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting order:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * Admin: Get all today's orders
 */
export const getAllTodaysOrders = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            oh_orderDate: { $gte: todayStart, $lte: todayEnd },
        }).populate("oh_userID", "um_firstName um_lastName um_username");

        res.status(200).json(orders);
    } catch (err) {
        console.error("❌ Error fetching all orders:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


/**
 * Update an existing order by ID or by userId (for today)
 */
export const updateOrder = async (req, res) => {
    try {
        const { userId, items } = req.body;

        if (!userId) return res.status(400).json({ message: "Missing userId" });
        if (!items || !items.length)
            return res.status(400).json({ message: "No items provided" });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 🧠 Find the user's order for today
        const order = await Order.findOne({
            oh_userID: userId,
            oh_orderDate: { $gte: todayStart, $lte: todayEnd },
        });

        if (!order) {
            return res.status(404).json({ message: "No existing order found to update" });
        }

        // 🧾 Map new items by name for easy lookup
        const newItemsMap = new Map(items.map((i) => [i.name, i]));

        // 🔁 Update or remove existing items
        order.items = order.items
            .map((existing) => {
                const newItem = newItemsMap.get(existing.name);
                if (!newItem) return null; // ❌ remove item if not in payload
                return {
                    ...existing.toObject(),
                    qty: newItem.qty,
                    price: newItem.price,
                };
            })
            .filter(Boolean); // remove nulls (deleted items)

        // ➕ Add new items not in DB
        const existingNames = order.items.map((i) => i.name);
        for (const newItem of items) {
            if (!existingNames.includes(newItem.name)) {
                order.items.push(newItem);
            }
        }

        // 🧹 Remove items with qty = 0
        order.items = order.items.filter((i) => i.qty > 0);

        // 🧮 Recalculate total
        order.oh_totalAmount = order.items.reduce(
            (sum, i) => sum + i.price * i.qty,
            0
        );

        await order.save();

        console.log("✏️ Order updated successfully");
        res.status(200).json({
            message: "Order updated successfully",
            order,
        });
    } catch (err) {
        console.error("❌ Error updating order:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

