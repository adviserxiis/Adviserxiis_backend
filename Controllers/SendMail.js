import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator'

import {app} from '../firebase.js'
import { getDatabase, ref, get, update } from 'firebase/database';


const database = getDatabase(app);

const generateOTP = () => {
    return otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    });
  };   



  async function getUser(userId) {
    const nodeRef = ref(database, `advisers/${userId}`);
    try {
      const snapshot = await get(nodeRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log('No data available');
        return null;
      }
    } catch (error) {
      console.error('Error fetching node details:', error);
      return null;
    }
  }

  async function saveOTP(userid, otp)
  {
    update(ref(database, 'advisers/' + userid),{
        otp:otp
      });
  }

const sendMail =  async(req, res) =>{

    const userId = req.params.userId;
    const transporter = nodemailer.createTransport({
        service:"gmail",
        port: 465,
        secure: true, // Use `true` for port 465, `false` for all other ports
        auth: {
          user: "adviserxiis@gmail.com",
          pass: "ziwo lsoq xeaj vran",
        },
      });
      
      // async..await is not allowed in global scope, must use a wrapper
      async function main() {
        // send mail with defined transport object

        const otp = generateOTP();
        const user = await getUser(userId);
      

        if(user && user.email)
          {

            await saveOTP(userId,otp )
            const info = await transporter.sendMail({
              from: 'adviserxiis@gmail.com', // sender address
              to: user.email, // list of receivers
              subject: "Verification mail from Adviserxiis", // Subject line
              text: `Your one time password for signup is ${otp}. Thank you for joining with Adviserxiis.`, // plain text body
            //   html: "<b>Hello world?</b>",  html body
            });
    
    
     
          
            // console.log("Message sent: %s", info.messageId);
            // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
    
            res.status(200).json("OTP send successfully")
          }

           res.json("User does not exist with this email")
        
      }
      
      main().catch(console.error);
} 

export { sendMail }