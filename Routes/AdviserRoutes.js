import { Router } from 'express'
import { documentUpload, loginAdviser, saveBankDetails, saveProfessionalDetails, signupAdviser, verifyOTP} from '../Controllers/AdviserController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });


const router = new Router();


router.route('/login').post(loginAdviser)
router.route('/signup').post(signupAdviser)
router.route('/professionaldetails').post(saveProfessionalDetails)
router.route('/bankdetails').post(saveBankDetails)
router.route('/verifyotp').post(verifyOTP)
router.post('/uploaddocuments', upload.fields([
    { name: 'profile_photo' },
    { name: 'aadhar_front' },
    { name: 'aadhar_back' }
  ]), documentUpload);



export default router;