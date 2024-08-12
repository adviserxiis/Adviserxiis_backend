import { Router } from "express";
import multer from 'multer';
import { getUserDetails, login, saveDetails, signUp } from "../Controllers/CreatorController.js";

const upload = multer({ storage: multer.memoryStorage() });


const router = new Router();


router.route('/signup').post(signUp)
router.route('/login').post(login)
router.post('/savedetails', upload.fields([
    { name: 'profile_photo' },
    { name: 'profile_background' },
  ]),saveDetails );
  router.route('/getuser/:userid').get(getUserDetails)



export default router