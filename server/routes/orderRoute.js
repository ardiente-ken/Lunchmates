import express from "express"
import { submitOrder, getTodaysOrder, cancelOrder, getAllTodaysOrders, updateOrder } from "../controller/orderController.js"

const orderRoute = express.Router();

//user routes
orderRoute.post("/order/submit", submitOrder)
orderRoute.get("/order/get", getTodaysOrder)
orderRoute.get("/order/get/all", getAllTodaysOrders)
orderRoute.delete("/order/cancel", cancelOrder)
orderRoute.put("/order/update", updateOrder); // 🆕 new update route

export default orderRoute;