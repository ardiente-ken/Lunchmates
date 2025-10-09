import { getPool } from "../config/db.config.js";
import sql from "mssql";

// ✅ Get all cutoff records
export const getCutOffs = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT co_date, co_time 
      FROM T_CutOff
      ORDER BY co_date DESC, co_time DESC
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching cutoff data:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Add new cutoff
export const addCutOff = async (req, res) => {
  const { co_date, co_time } = req.body;

  if (!co_date || !co_time) {
    return res.status(400).json({ message: "Date and time are required" });
  }

  try {
    const pool = await getPool();
    await pool
      .request()
      .input("co_date", sql.Date, co_date)
      .input("co_time", sql.VarChar, co_time)
      .query(`
        INSERT INTO T_CutOff (co_date, co_time)
        VALUES (@co_date, @co_time)
      `);

    res.status(201).json({ message: "Cut-off added successfully" });
  } catch (err) {
    console.error("Error adding cutoff:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
