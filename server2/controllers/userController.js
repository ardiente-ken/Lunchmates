import { getPool } from "../config/db.config.js";
import sql from "mssql";

export const loginUser = async (req, res) => {
  console.log("=======================================");
  console.log("🟦 [LOGIN ATTEMPT]");
  console.log("🕒", new Date().toLocaleString());
  console.log("📩 Headers:", req.headers);
  console.log("📨 Body:", req.body);
  console.log("=======================================");

  const { username, password } = req.body;

  if (!username || !password) {
    console.warn("⚠️ Missing username or password");
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    console.log("🔄 Connecting to SQL Server...");
    const pool = await getPool();

    console.log("✅ Connected. Running query...");
    const startTime = Date.now();

    const result = await pool
      .request()
      .input("username", sql.VarChar, username)
      .input("password", sql.VarChar, password)
      .query(`
        SELECT um_userID, um_firstName, um_lastName, um_userType, um_username
        FROM T_UserMaster
        WHERE um_username = @username AND um_userPassword = @password
      `);

    console.log(`📦 Query complete (${Date.now() - startTime} ms)`);
    console.log("📊 Rows returned:", result.recordset.length);
    console.log("📤 Raw result:", result.recordset);

    if (result.recordset.length === 0) {
      console.warn("❌ Invalid credentials for:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.recordset[0];
    console.log(`✅ Login successful for: ${user.um_username} (${user.um_userType})`);

    return res.status(200).json({
      message: "Login successful!",
      user: {
        id: user.um_userID,
        firstName: user.um_firstName,
        lastName: user.um_lastName,
        username: user.um_username,
        userType: user.um_userType,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
