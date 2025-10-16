import DailyMenu from "../model/dailyMenuModel.js";

/**
 * Insert multiple daily menu items
 * Prevent duplicates based on dm_date + dm_itemName
 */
export const insertDailyMenu = async (req, res) => {
    const items = req.body.items;
    if (!items || !items.length) {
        console.warn("⚠️ No items provided in request body");
        return res.status(400).json({ message: "Items are required" });
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    console.log(`📅 Inserting daily menu for date: ${today}`);

    try {
        let insertedCount = 0;

        for (let i = 0; i < items.length; i++) {
            const { itemName, itemPrice } = items[i];
            console.log(`🟢 Processing item ${i + 1}/${items.length}: ${itemName} - ₱${itemPrice}`);

            try {
                const newMenuItem = new DailyMenu({
                    dm_date: today,
                    dm_itemName: itemName,
                    dm_itemPrice: itemPrice,
                });
                await newMenuItem.save();
                console.log(`✅ Inserted item: ${itemName}`);
                insertedCount++;
            } catch (err) {
                // Duplicate key error is ignored
                if (err.code === 11000) {
                    console.warn(`⚠️ Skipping duplicate item: ${itemName} for ${today}`);
                } else {
                    throw err;
                }
            }
        }

        console.log(`🎉 Finished inserting daily menu items. ${insertedCount} new items added.`);
        res.status(201).json({
            message: `Daily menu inserted successfully. ${insertedCount} new items added. Duplicates were skipped.`,
        });
    } catch (err) {
        console.error("❌ Insert daily menu error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * Get today's daily menu
 */
export const getTodayDailyMenu = async (req, res) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    console.log(`📅 Fetching daily menu for: ${today}`);

    try {
        const menu = await DailyMenu.find({ dm_date: today }).sort({ dm_itemName: 1 });

        if (!menu.length) {
            console.warn("⚠️ No daily menu found for today");
            return res.status(404).json({ message: "No menu set for today" });
        }

        console.log(`✅ Found ${menu.length} menu items for today`);
        menu.forEach((item, index) => {
            console.log(`🍽️ Item ${index + 1}: ${item.dm_itemName} - ₱${item.dm_itemPrice}`);
        });

        res.status(200).json({ menu });
    } catch (err) {
        console.error("❌ Fetch daily menu error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * Update a daily menu item by itemName and dm_date
 * Body: { itemName, date, newItemName?, newItemPrice? }
 */
export const updateDailyMenuItem = async (req, res) => {
    const { itemName, date, newItemName, newItemPrice } = req.body;

    if (!itemName || !date) {
        return res.status(400).json({ message: "itemName and date are required to identify the menu item" });
    }

    try {
        const menuItem = await DailyMenu.findOne({ dm_date: date, dm_itemName: itemName });
        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found for the given date" });
        }

        if (newItemName) menuItem.dm_itemName = newItemName;
        if (newItemPrice !== undefined) menuItem.dm_itemPrice = newItemPrice;

        await menuItem.save();

        res.status(200).json({
            message: "Menu item updated successfully",
            menuItem,
        });
    } catch (err) {
        console.error("❌ Update daily menu item error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * Delete a daily menu item by itemName and dm_date
 * Body: { itemName, date }
 */
export const deleteDailyMenuItem = async (req, res) => {
    const { itemName, date } = req.body;

    if (!itemName || !date) {
        return res.status(400).json({ message: "itemName and date are required to delete the menu item" });
    }

    try {
        const deleted = await DailyMenu.findOneAndDelete({ dm_date: date, dm_itemName: itemName });
        if (!deleted) {
            return res.status(404).json({ message: "Menu item not found for the given date" });
        }

        res.status(200).json({
            message: "Menu item deleted successfully",
            deletedItem: deleted,
        });
    } catch (err) {
        console.error("❌ Delete daily menu item error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};