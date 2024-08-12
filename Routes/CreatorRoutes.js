import { Router } from "express";
import multer from 'multer';
import { getUserByUsername, getUserDetails, login, saveDetails, signUp } from "../Controllers/CreatorController.js";

const upload = multer({ storage: multer.memoryStorage() });


const router = new Router();


router.route('/signup').post(signUp)
router.route('/login').post(login)
router.post('/savedetails', upload.fields([
    { name: 'profile_photo' },
    { name: 'profile_background' },
  ]),saveDetails );
  router.route('/getuser/:userid').get(getUserDetails)
  router.route('/getuserbyname').get(getUserByUsername)
  router.route('/getuserbyname/:key').get(getUserByUsername)



export default router