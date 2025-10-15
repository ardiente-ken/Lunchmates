import express from "express"
import { create, login } from "../controller/userController.js"

const route = express.Router();

//user routes
route.post("/user/create", create)
route.post("/user/login", login)

export default route;