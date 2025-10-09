import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

// ✅ These must be before your routes
app.use(cors());
app.use(express.json());  // <--- this is critical
app.use(express.urlencoded({ extended: true })); // optional, for form data

// ROUTES
app.use("/api/users", userRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`✅ Server running on port ${process.env.PORT}`)
);
