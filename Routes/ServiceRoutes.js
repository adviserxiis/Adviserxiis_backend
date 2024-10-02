import { Router } from "express"
import { createService, getAllServicesByAdviser } from "../Controllers/ServiceController.js";


const router = new Router();

router.route('/createservice').post(createService)
router.route('/getallservicesofadviser/:adviserid').get(getAllServicesByAdviser)


export default router