import express from "express";
import { upsertCutOff, getTodayCutOff } from "../controllers/cutOffController.js";

const router = express.Router();

// POST /api/cutoff -> set or update today's cut-off time
router.post("/", upsertCutOff);

// GET /api/cutoff -> get today's cut-off time
router.get("/", getTodayCutOff);

export default router;
