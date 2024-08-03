import { Router } from "express";
import { loginUser } from "../Controllers/UserController.js";


const router = new Router();

router.route('/login').post(loginUser)


export default router;