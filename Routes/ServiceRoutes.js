import { Router } from "express"
import { createService, editService, getAllServicesByAdviser } from "../Controllers/ServiceController.js";


const router = new Router();

router.route('/createservice').post(createService)
router.route('/getallservicesofadviser/:adviserid').get(getAllServicesByAdviser)
router.route('/editservice').post(editService)


export default router