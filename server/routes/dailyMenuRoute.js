import express from "express"
import { insertDailyMenu, getTodayDailyMenu, updateDailyMenuItem, deleteDailyMenuItem } from "../controller/dailyMenuController.js"

const dailyMenuRoute = express.Router();

//user routes
dailyMenuRoute.post("/daily-menu/set", insertDailyMenu)
dailyMenuRoute.get("/daily-menu/get", getTodayDailyMenu)
dailyMenuRoute.put("/daily-menu/update", updateDailyMenuItem)
dailyMenuRoute.delete("/daily-menu/delete", deleteDailyMenuItem)

export default dailyMenuRoute;