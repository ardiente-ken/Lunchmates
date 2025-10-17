import express from "express"
import { create, login } from "../controller/userController.js"

const userRoute = express.Router();

//user routes
userRoute.post("/user/create", create)
userRoute.post("/user/login", login)

export default userRoute;