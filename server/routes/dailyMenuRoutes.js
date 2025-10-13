import express from "express";
import { getTodayDailyMenu, insertDailyMenu } from "../controllers/dailyMenuController.js";

const router = express.Router();

// POST /api/dailymenu
router.post("/", insertDailyMenu);
router.get("/", getTodayDailyMenu);

export default router;
