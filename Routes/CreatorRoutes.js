import { Router } from "express";
import multer from 'multer';
import { followCreator, getUserByUsername, getUserDetails, login, resetPassword, saveDetails, sendResetPasswordOtp, signUp, unfollowCreator, verifyResetPasswordOtp } from "../Controllers/CreatorController.js";

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
router.route('/sendchangepasswordotp').post(sendResetPasswordOtp)
router.route('/verifychangepasswordotp').post(verifyResetPasswordOtp)
router.route('/resetpassword').post(resetPassword)
router.route('/followcreator').post(followCreator)
router.route('/unfollowcreator').post(unfollowCreator)



export default router