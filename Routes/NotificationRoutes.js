import { Router } from "express";
import { sendNotification, sendNotificationToAllCreators } from "../Controllers/NotificationController.js";


const router = new Router();

router.route('/sendnotification').post(sendNotification)
router.route('/sendnotificationtoall').post(sendNotificationToAllCreators)


export default router