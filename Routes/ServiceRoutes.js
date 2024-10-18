import { Router } from "express"
import { createService, deleteService, editService, getAdviserAvailability, getAllServicesByAdviser, getAvailableTimeSlots, getBookingsOfUser, getServiceDetails, savePaymentDetails } from "../Controllers/ServiceController.js";


const router = new Router();

router.route('/createservice').post(createService)
router.route('/deleteservice').post(deleteService)
router.route('/getallservicesofadviser/:adviserid').get(getAllServicesByAdviser)
router.route('/editservice').post(editService)
router.route('/getavailabledays/:adviserid').get(getAdviserAvailability)
router.route('/getavailabletimeslots').post(getAvailableTimeSlots)
router.route('/bookorder').post(savePaymentDetails)
router.route('/getbookingsofuser/:userid').get(getBookingsOfUser)
router.route('/getservicedetails/:serviceid').get(getServiceDetails)


export default router