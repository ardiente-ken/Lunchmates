import express from "express";
import { submitOrder, getTodaysOrders } from "../controllers/orderController.js";

const router = express.Router();

// POST /api/orders
router.post("/", submitOrder);
router.get("/today", getTodaysOrders);

export default router;
