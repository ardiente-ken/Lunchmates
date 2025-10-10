import { getPool } from "../config/db.config.js";
import sql from "mssql";

/**
 * Submit or update today's order for the logged-in user.
 * - If user has an existing order today → update it
 * - Else → create new order
 */
export const submitOrder = async (req, res) => {
  try {
    const userId = req.body.userId;
    const items = req.body.orderItems || req.body.items;

    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }
    if (!items || !items.length) {
      return res.status(400).json({ message: "No order items provided" });
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const today = new Date().toISOString().split("T")[0];

    // 🧾 Check if user already has an order today
    const checkReq = new sql.Request(transaction);
    const existingHeader = await checkReq
      .input("userId", sql.Int, userId)
      .input("today", sql.Date, today)
      .query(`
        SELECT TOP 1 oh_orderID 
        FROM T_OrderHeader 
        WHERE oh_userID = @userId AND CONVERT(date, oh_orderDate) = @today
      `);

    let orderID;

    if (existingHeader.recordset.length > 0) {
      // 🟡 Existing order → update it
      orderID = existingHeader.recordset[0].oh_orderID;
      console.log(`🔄 Updating existing order ${orderID} for user ${userId}`);

      // Loop through items: update if exists, else insert
      for (const item of items) {
        const detailCheck = new sql.Request(transaction);
        const existingDetail = await detailCheck
          .input("orderID", sql.Int, orderID)
          .input("itemName", sql.NVarChar(255), item.name)
          .query(`
            SELECT TOP 1 od_orderID 
            FROM T_OrderDetail 
            WHERE od_orderID = @orderID AND od_orderItemName = @itemName
          `);

        if (existingDetail.recordset.length > 0) {
          // 🟢 Update existing item qty & price
          const updateReq = new sql.Request(transaction);
          await updateReq
            .input("orderID", sql.Int, orderID)
            .input("itemName", sql.NVarChar(255), item.name)
            .input("qty", sql.Int, item.qty)
            .input("price", sql.Decimal(10, 2), item.price)
            .query(`
              UPDATE T_OrderDetail 
              SET od_qty = @qty, od_orderItemPrice = @price
              WHERE od_orderID = @orderID AND od_orderItemName = @itemName
            `);
          console.log(`   ✏️ Updated ${item.name} x${item.qty}`);
        } else {
          // 🟢 Insert new item
          const insertReq = new sql.Request(transaction);
          await insertReq
            .input("orderID", sql.Int, orderID)
            .input("orderDate", sql.DateTime, new Date())
            .input("itemName", sql.NVarChar(255), item.name)
            .input("itemPrice", sql.Decimal(10, 2), item.price)
            .input("qty", sql.Int, item.qty)
            .query(`
              INSERT INTO T_OrderDetail (od_orderID, od_orderDate, od_orderItemName, od_orderItemPrice, od_qty)
              VALUES (@orderID, @orderDate, @itemName, @itemPrice, @qty)
            `);
          console.log(`   ➕ Added new item: ${item.name} x${item.qty}`);
        }
      }
    } else {
      // 🆕 New order → insert header and details
      const headerReq = new sql.Request(transaction);
      const headerResult = await headerReq
        .input("userId", sql.Int, userId)
        .input("orderDate", sql.DateTime, new Date())
        .input("totalAmount", sql.Decimal(10, 2), 0)
        .query(`
          INSERT INTO T_OrderHeader (oh_userID, oh_orderDate, oh_totalAmount)
          OUTPUT INSERTED.oh_orderID
          VALUES (@userId, @orderDate, @totalAmount)
        `);

      orderID = headerResult.recordset[0].oh_orderID;
      console.log(`🆕 Created new order header ${orderID} for user ${userId}`);

      for (const item of items) {
        const detailReq = new sql.Request(transaction);
        await detailReq
          .input("orderID", sql.Int, orderID)
          .input("orderDate", sql.DateTime, new Date())
          .input("itemName", sql.NVarChar(255), item.name)
          .input("itemPrice", sql.Decimal(10, 2), item.price)
          .input("qty", sql.Int, item.qty)
          .query(`
            INSERT INTO T_OrderDetail (od_orderID, od_orderDate, od_orderItemName, od_orderItemPrice, od_qty)
            VALUES (@orderID, @orderDate, @itemName, @itemPrice, @qty)
          `);
        console.log(`   ➕ Added item: ${item.name} x${item.qty}`);
      }
    }

    // 🔁 Recalculate totalAmount
    const totalReq = new sql.Request(transaction);
    const totalResult = await totalReq
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT SUM(od_orderItemPrice * od_qty) AS total 
        FROM T_OrderDetail 
        WHERE od_orderID = @orderID
      `);

    const newTotal = totalResult.recordset[0].total || 0;

    const updateHeaderReq = new sql.Request(transaction);
    await updateHeaderReq
      .input("orderID", sql.Int, orderID)
      .input("totalAmount", sql.Decimal(10, 2), newTotal)
      .query(`
        UPDATE T_OrderHeader 
        SET oh_totalAmount = @totalAmount 
        WHERE oh_orderID = @orderID
      `);

    await transaction.commit();

    console.log(`✅ Order ${orderID} saved successfully (total ₱${newTotal})`);
    res.status(200).json({
      message: "Order saved successfully",
      orderId: orderID,
      totalAmount: newTotal,
    });
  } catch (err) {
    console.error("❌ Error submitting/updating order:", err);
    res.status(500).json({
      message: "Server error submitting/updating order",
      error: err.message,
    });
  }
};

/**
 * Get today's orders for a user
 */
export const getTodaysOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const pool = await getPool();
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .input("today", sql.Date, today)
      .query(`
        SELECT 
          od.od_orderItemName AS name,
          od.od_orderItemPrice AS price,
          od.od_qty AS qty,
          oh.oh_orderDate AS orderDate
        FROM T_OrderHeader oh
        INNER JOIN T_OrderDetail od ON oh.oh_orderID = od.od_orderID
        WHERE oh.oh_userID = @userId 
          AND CONVERT(date, oh.oh_orderDate) = @today
      `);

    res.status(200).json(result.recordset || []);
  } catch (err) {
    console.error("❌ Error fetching today's orders:", err);
    res.status(500).json({ message: "Server error fetching today's orders" });
  }
};
