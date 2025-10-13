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

      // 🧹 Handle items that are no longer in payload → set qty = 0
      // 🧹 Handle items that are no longer in payload → set qty = 0
      const payloadItemNames = items.map(i => i.name);

      if (payloadItemNames.length > 0) {
        const zeroReq = new sql.Request(transaction);
        zeroReq.input("orderID", sql.Int, orderID);

        // Dynamically bind all @nameX parameters
        payloadItemNames.forEach((name, i) =>
          zeroReq.input(`name${i}`, sql.NVarChar(255), name)
        );

        // Build safe parameter placeholders for NOT IN clause
        const placeholders = payloadItemNames.map((_, i) => `@name${i}`).join(", ");

        await zeroReq.query(`
    UPDATE T_OrderDetail
    SET od_qty = 0
    WHERE od_orderID = @orderID
    AND od_orderItemName NOT IN (${placeholders})
  `);

        console.log("🧮 Set qty=0 for items not in payload");
      }


      // 🔁 Update existing or insert new items
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
          console.log(`✏️ Updated ${item.name} x${item.qty}`);
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
          console.log(`➕ Added new item: ${item.name} x${item.qty}`);
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
        console.log(`➕ Added item: ${item.name} x${item.qty}`);
      }
    }

    // 🔁 Recalculate totalAmount (only count qty > 0)
    const totalReq = new sql.Request(transaction);
    const totalResult = await totalReq
      .input("orderID", sql.Int, orderID)
      .query(`
        SELECT SUM(od_orderItemPrice * od_qty) AS total 
        FROM T_OrderDetail 
        WHERE od_orderID = @orderID AND od_qty > 0
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
          AND od.od_qty > 0
      `);

    res.status(200).json(result.recordset || []);
  } catch (err) {
    console.error("❌ Error fetching today's orders:", err);
    res.status(500).json({ message: "Server error fetching today's orders" });
  }
};

/**
 * Get all today's orders (for HR/admin use)
 */
export const getOrders = async (req, res) => {
  try {
    const pool = await getPool();
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.request()
      .input("today", sql.Date, today)
      .query(`
        SELECT 
          u.um_firstname AS userName,
          od.od_orderItemName AS name,
          od.od_orderItemPrice AS price,
          od.od_qty AS qty,
          oh.oh_orderDate AS orderDate
        FROM T_OrderHeader oh
        INNER JOIN T_OrderDetail od ON oh.oh_orderID = od.od_orderID
        INNER JOIN T_UserMaster u ON oh.oh_userID = u.um_userid
        WHERE CONVERT(date, oh.oh_orderDate) = @today
          AND od.od_qty > 0
        ORDER BY u.um_firstname
      `);

    res.status(200).json(result.recordset || []);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

export const cancelOrder = async (req, res) => {
  const { userId } = req.query; // from frontend ?userId=123

  if (!userId) {
    return res.status(400).json({ message: "Missing userId parameter." });
  }

  try {
    const pool = await getPool(); // ✅ use the shared pool from db.config.js
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const today = new Date().toISOString().split("T")[0];

      // 🔍 Get today’s order for that user
      const headerResult = await new sql.Request(transaction)
        .input("userId", sql.Int, userId)
        .input("today", sql.Date, today)
        .query(`
          SELECT TOP 1 oh_orderID
          FROM T_OrderHeader
          WHERE oh_userID = @userId
          AND CONVERT(date, oh_orderDate) = @today
        `);

      if (headerResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: "No order found for today." });
      }

      const orderID = headerResult.recordset[0].oh_orderID;

      // 🗑 Delete from details first (foreign key-safe)
      await new sql.Request(transaction)
        .input("orderID", sql.Int, orderID)
        .query(`
          DELETE FROM T_OrderDetail 
          WHERE od_orderID = @orderID
        `);

      // 🗑 Then delete from header
      await new sql.Request(transaction)
        .input("orderID", sql.Int, orderID)
        .query(`
          DELETE FROM T_OrderHeader 
          WHERE oh_orderID = @orderID
        `);

      await transaction.commit();
      console.log(`🗑 Order ${orderID} for user ${userId} cancelled successfully`);

      res.status(200).json({ message: "Order cancelled successfully." });
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Error during cancel transaction:", err);
      res.status(500).json({
        message: "Failed to cancel order.",
        error: err.message,
      });
    }
  } catch (err) {
    console.error("❌ Database connection error:", err);
    res.status(500).json({
      message: "Database connection failed.",
      error: err.message,
    });
  }
};

export const getEmployeeOrdersToday = async (req, res) => {
  try {
    const pool = await getPool(); // ✅ use the shared pool from db.config.js

    // 🧾 Detailed orders
    const result = await pool.request().query(`
      SELECT 
        u.um_userid AS userId,
        u.um_firstname AS userName,
        oh.oh_orderID AS orderId,
        oh.oh_orderDate AS orderDate,
        od.od_orderItemName AS itemName,
        od.od_orderItemPrice AS price,
        od.od_qty AS qty,
        (
          SELECT SUM(od2.od_orderItemPrice * od2.od_qty)
          FROM T_OrderHeader oh2
          INNER JOIN T_OrderDetail od2 ON oh2.oh_orderID = od2.od_orderID
          WHERE oh2.oh_userID = u.um_userid
          AND CAST(oh2.oh_orderDate AS DATE) = CAST(GETDATE() AS DATE)
        ) AS totalPerUser
      FROM T_UserMaster u
      INNER JOIN T_OrderHeader oh
        ON u.um_userid = oh.oh_userID
        AND CAST(oh.oh_orderDate AS DATE) = CAST(GETDATE() AS DATE)
      INNER JOIN T_OrderDetail od
        ON oh.oh_orderID = od.od_orderID
      WHERE od.od_qty > 0
        AND u.um_usertype = 'Employee'
      ORDER BY u.um_firstname;
    `);

    // 🧮 Count unique employees who ordered today
    const countResult = await pool.request().query(`
      SELECT COUNT(DISTINCT oh.oh_userID) AS employeeCount
      FROM T_OrderHeader oh
      INNER JOIN T_UserMaster u ON u.um_userid = oh.oh_userID
      WHERE u.um_usertype = 'Employee'
        AND CAST(oh.oh_orderDate AS DATE) = CAST(GETDATE() AS DATE)
    `);

    res.status(200).json({
      employeeCount: countResult.recordset[0].employeeCount,
      orders: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching employee orders:", error);
    res.status(500).json({ message: "Error fetching employee orders", error });
  }
};


export const getEmployeeOrderSummaryToday = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        od.od_orderItemName AS itemName,
        SUM(od.od_qty) AS totalQty,
        SUM(od.od_orderItemPrice * od.od_qty) AS totalSales
      FROM T_OrderHeader oh
      INNER JOIN T_OrderDetail od ON oh.oh_orderID = od.od_orderID
      INNER JOIN T_UserMaster u ON oh.oh_userID = u.um_userid
      WHERE u.um_usertype = 'Employee'
        AND CAST(oh.oh_orderDate AS DATE) = CAST(GETDATE() AS DATE)
        AND od.od_qty > 0
      GROUP BY od.od_orderItemName
      ORDER BY od.od_orderItemName;
    `);

    res.status(200).json({
      message: "Employee order summary fetched successfully",
      summary: result.recordset,
    });
  } catch (error) {
    console.error("❌ Error fetching employee order summary:", error);
    res.status(500).json({
      message: "Error fetching employee order summary",
      error: error.message,
    });
  }
};
