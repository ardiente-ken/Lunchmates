import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

export const loginUser = async (req, res) => {
    console.log("➡️ req.body:", req.body);
    console.log("➡️ Content-Type:", req.headers["content-type"]);
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ message: "Username and password required" });

    try {
        const pool = await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: {
                encrypt: false,
                trustServerCertificate: true,
            },
        });

        const result = await pool
            .request()
            .input("username", sql.VarChar, username)
            .input("password", sql.VarChar, password)
            .query(`
        SELECT um_userID, um_firstName, um_lastName, um_userType, um_username
        FROM T_UserMaster
        WHERE um_username = @username AND um_userPassword = @password
      `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = result.recordset[0];
        return res.status(200).json({ message: "Login successful", user });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
