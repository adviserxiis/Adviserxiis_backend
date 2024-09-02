import { Router } from "express";
import { sendNotification } from "../Controllers/NotificationController.js";


const router = new Router();

router.route('/sendnotification').post(sendNotification)


export default router