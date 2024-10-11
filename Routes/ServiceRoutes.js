import { Router } from "express"
import { createService, editService, getAdviserAvailability, getAllServicesByAdviser, getAvailableTimeSlots, savePaymentDetails } from "../Controllers/ServiceController.js";


const router = new Router();

router.route('/createservice').post(createService)
router.route('/getallservicesofadviser/:adviserid').get(getAllServicesByAdviser)
router.route('/editservice').post(editService)
router.route('/getavailabledays/:adviserid').get(getAdviserAvailability)
router.route('/getavailabletimeslots').post(getAvailableTimeSlots)
router.route('/bookorder').post(savePaymentDetails)


export default router