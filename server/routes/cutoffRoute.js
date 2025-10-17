import express from "express"
import { setTodayCutOff, getTodayCutOff } from "../controller/cutoffController.js"

const cutoffRoute = express.Router();

//user routes
cutoffRoute.post("/cutoff/set", setTodayCutOff)
cutoffRoute.get("/cutoff/get", getTodayCutOff)

export default cutoffRoute;