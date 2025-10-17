import { getPool } from "../config/db.config.js";
import sql from "mssql";

/**
 * Add or update cut-off time
 * Body: { time: "HH:MM:SS" }
 */
export const upsertCutOff = async (req, res) => {
    const { time } = req.body;

    console.log("🟦 Cut-Off request received");
    console.log("➡️ Time provided:", time);

    if (!time) {
        console.warn("⚠️ Missing time in request");
        return res.status(400).json({ message: "Time is required" });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    console.log("➡️ Today's date:", todayStr);

    try {
        const pool = await getPool();

        // 1️⃣ Check if record exists for today
        const check = await pool
            .request()
            .input("date", sql.Date, todayStr)
            .query("SELECT * FROM T_CutOff WHERE co_date = @date");

        console.log("➡️ Existing record count:", check.recordset.length);

        if (check.recordset.length > 0) {
            // 2️⃣ Update existing record
            await pool
                .request()
                .input("time", sql.VarChar, time)
                .input("date", sql.Date, todayStr)
                .query("UPDATE T_CutOff SET co_time = @time WHERE co_date = @date");

            console.log(`✅ Cut-off updated for ${todayStr} to ${time}`);
            return res.status(200).json({
                message: `Cut-off time updated for today (${todayStr}) to ${time}`,
            });
        } else {
            // 3️⃣ Insert new record
            await pool
                .request()
                .input("date", sql.Date, todayStr)
                .input("time", sql.VarChar, time) // send as string HH:mm:ss
                .query("INSERT INTO T_CutOff (co_date, co_time) VALUES (@date, @time)");

            console.log(`✅ Cut-off set for ${todayStr} at ${time}`);
            return res.status(201).json({
                message: `Cut-off time set for today (${todayStr}) at ${time}`,
            });
        }
    } catch (err) {
        console.error("❌ Cut-off error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * Get today's cut-off time
 */
export const getTodayCutOff = async (req, res) => {
    const todayStr = new Date().toISOString().split("T")[0];
    console.log("🟦 Fetch cut-off for today:", todayStr);

    try {
        const pool = await getPool();
        const result = await pool
            .request()
            .input("date", sql.Date, todayStr)
            .query("SELECT * FROM T_CutOff WHERE co_date = @date");

        if (result.recordset.length === 0) {
            console.warn("⚠️ No cut-off set for today");
            return res.status(404).json({ message: "No cut-off set for today" });
        }

        console.log("✅ Cut-off fetched:", result.recordset[0]);
        return res.status(200).json({ cutOff: result.recordset[0] });
    } catch (err) {
        console.error("❌ Get cut-off error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
