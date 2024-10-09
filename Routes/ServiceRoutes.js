import { Router } from "express"
import { createService, editService, getAllServicesByAdviser, savePaymentDetails } from "../Controllers/ServiceController.js";


const router = new Router();

router.route('/createservice').post(createService)
router.route('/getallservicesofadviser/:adviserid').get(getAllServicesByAdviser)
router.route('/editservice').post(editService)
router.route('/bookorder').post(savePaymentDetails)


export default router