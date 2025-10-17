import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors"; // ✅ import cors

// Routes
import userRoute from "./routes/userRoute.js";
import cutOffRoute from "./routes/cutoffRoute.js";
import dailyMenuRoute from "./routes/dailyMenuRoute.js"
import orderRoute from "./routes/orderRoute.js";
import orderStatusRoute from "./routes/orderStatusRoute.js";
// App
const app = express();
dotenv.config();

// Enable CORS for all origins
app.use(cors());

// If you want to allow only specific origin:
// app.use(cors({ origin: "http://localhost:3000" }));

app.use(bodyParser.json());

// MongoDB connection
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("DB Connected");
    app.listen(PORT, () => {
      console.log(`Server is Running on port: ${PORT}`);
    });
  })
  .catch((error) => console.log(error));

// Routes
app.use("/api", userRoute);
app.use("/api", cutOffRoute);
app.use("/api", dailyMenuRoute);
app.use("/api", orderRoute);
app.use("/api", orderStatusRoute);