import { getPool } from "../config/db.config.js";
import sql from "mssql";

/**
 * Insert multiple daily menu items
 * Items: [{ itemName, itemPrice }]
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
    const pool = await getPool();
    console.log("✅ Database connection established");

    // Get current max dm_ID for today
    const result = await pool
      .request()
      .input("date", sql.Date, today)
      .query("SELECT MAX(dm_ID) AS maxID FROM T_DailyMenu WHERE dm_date = @date");

    let nextID = (result.recordset[0].maxID || 0) + 1;
    console.log(`🔢 Starting next dm_ID at: ${nextID}`);

    // Loop through items
    for (let i = 0; i < items.length; i++) {
      const { itemName, itemPrice } = items[i];
      console.log(`🟢 Processing item ${i + 1}/${items.length}: ${itemName} - ₱${itemPrice}`);

      // Check for duplicate
      const duplicateCheck = await pool
        .request()
        .input("date", sql.Date, today)
        .input("name", sql.NVarChar(255), itemName)
        .query(
          "SELECT COUNT(*) AS count FROM T_DailyMenu WHERE dm_date = @date AND dm_itemName = @name"
        );

      if (duplicateCheck.recordset[0].count > 0) {
        console.warn(`⚠️ Skipping duplicate item: ${itemName} for ${today}`);
        continue;
      }

      // Insert new record
      await pool
        .request()
        .input("date", sql.Date, today)
        .input("id", sql.Int, nextID)
        .input("name", sql.NVarChar(255), itemName)
        .input("price", sql.Decimal(10, 2), itemPrice)
        .query(
          "INSERT INTO T_DailyMenu (dm_date, dm_ID, dm_itemName, dm_itemPrice) VALUES (@date, @id, @name, @price)"
        );

      console.log(`✅ Inserted item: ${itemName} (dm_ID: ${nextID})`);
      nextID++;
    }

    console.log("🎉 Finished inserting daily menu items.");
    res.status(201).json({ message: "Daily menu inserted successfully. Duplicates were skipped." });
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
    const pool = await getPool();
    console.log("✅ Database connection established");

    const result = await pool
      .request()
      .input("date", sql.Date, today)
      .query(
        "SELECT dm_itemName, dm_itemPrice FROM T_DailyMenu WHERE dm_date = @date ORDER BY dm_ID"
      );

    if (result.recordset.length === 0) {
      console.warn("⚠️ No daily menu found for today");
      return res.status(404).json({ message: "No menu set for today" });
    }

    console.log(`✅ Found ${result.recordset.length} menu items for today`);
    console.log(`✅ Found ${result.recordset.length} menu items for today`);
    result.recordset.forEach((row, index) => {
      console.log(`🍽️ Item ${index + 1}: ${row.dm_itemName} - ₱${row.dm_itemPrice}`);
    });

    res.status(200).json({ menu: result.recordset });
  } catch (err) {
    console.error("❌ Fetch daily menu error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
