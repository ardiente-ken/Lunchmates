import express from "express";
import {
    submitOrder,
    getTodaysOrders,
    cancelOrder,
    getEmployeeOrdersToday,
    getEmployeeOrderSummaryToday
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", submitOrder);
router.get("/today", getTodaysOrders);
router.delete("/", cancelOrder);

// 🆕 Get all employee orders for today
router.get("/today/employees", getEmployeeOrdersToday);
router.get("/summary", getEmployeeOrderSummaryToday);

export default router;
