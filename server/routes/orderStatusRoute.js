import express from "express"
import { getOrderStatus, setOrderStatus} from "../controller/orderStatusController.js"

const orderStatusRoute = express.Router();

//user routes
orderStatusRoute.get("/order/status", getOrderStatus);
orderStatusRoute.post("/order/status", setOrderStatus);

export default orderStatusRoute;