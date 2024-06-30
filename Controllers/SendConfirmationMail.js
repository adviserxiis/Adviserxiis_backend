import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator'

import {app} from '../firebase.js'
import { getDatabase, ref, get, update } from 'firebase/database';
import { v1 as uuidv1 } from 'uuid';


const database = getDatabase(app);

function convertDateFormat(dateString) {
    // Split the input date string by the hyphen
    const [year, month, day] = dateString.split('-');
  
    // Return the date in dd-mm-yyyy format
    return `${day}-${month}-${year}`;
  }

  async function getUser(userId) {
    const nodeRef = ref(database, `users/${userId}`);
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

  async function getAdviser(adviserId) {
    const nodeRef = ref(database, `advisers/${adviserId}`);
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

  async function getService(serviceId) {
    const nodeRef = ref(database, `advisers_service/${serviceId}`);
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

  async function getPayement(paymentId) {
    const nodeRef = ref(database, `payments/${paymentId}`);
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


  async function saveMeetingId(paymentId, meetingId) {
    const nodeRef = ref(database, `payments/${paymentId}`);
    try {
      await update(nodeRef, { meetingid: meetingId });
      // console.log('Meeting ID saved successfully');
    } catch (error) {
      console.error('Error saving meeting ID:', error);
    }
  }



const sendConfirmationMail =  async(req, res) =>{

    const { userid, adviserid, serviceid, paymentid } = req.body;

    const transporter = nodemailer.createTransport({
        service:"gmail",
        port: 465,
        secure: true, // Use `true` for port 465, `false` for all other ports
        auth: {
          user: "adviserxiis@gmail.com",
          pass: "ziwo lsoq xeaj vran",
        },
      });

      const user = await getUser(userid);
      const adviser = await getAdviser(adviserid);
      const service = await getService(serviceid)
      const payment = await getPayement(paymentid)
      const meetingid = uuidv1();
      const meetingLink =`https://adviserxiis.vercel.app/room/${meetingid}`
      
      
      // async..await is not allowed in global scope, must use a wrapper
      async function sendConfirmationMail() {
        // send mail with defined transport object

        const htmlTemplateUser = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
            }
            .container {
              margin: 20px;
            }
            .header {
              font-size: 1.2em;
              font-weight: bold;
            }
            .content {
              margin-top: 20px;
            }
            .footer {
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <p>Hi ${user.name},</p>
            <div class="content">
              <p>Your appointment for ${service.service_name} with ${adviser.username} has been successfully scheduled.</p>
              <p><strong>Date:</strong> ${convertDateFormat(payment.scheduled_date)}<br>
              <strong>Time:</strong> ${payment.scheduled_time}</p>
              <p><strong>Your meeting link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
              <p>Please make sure to be available at the scheduled time.</p>
            </div>
            <div class="footer">
              <p>Thank you,<br>
              Adviserxiis</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const htmlTemplateAdviser = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
          }
          .container {
            margin: 20px;
          }
          .header {
            font-size: 1.2em;
            font-weight: bold;
          }
          .content {
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p>Hi ${adviser.username},</p>
          <div class="content">
            <p>Your meeting for ${service.service_name} with ${user.name} has been successfully scheduled.</p>
            <p><strong>Date:</strong> ${convertDateFormat(payment.scheduled_date)}<br>
            <strong>Time:</strong> ${payment.scheduled_time}</p>
            <p><strong>Your meeting link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
            <p>Please make sure to be available at the scheduled time.</p>
          </div>
          <div class="footer">
            <p>Thank you,<br>
            Adviserxiis</p>
          </div>
        </div>
      </body>
      </html>
    `;


        const info1 = await transporter.sendMail({
          from: 'adviserxiis@gmail.com', // sender address
          to: user.email, // list of receivers
          subject: "Appointment Confirmation", // Subject line
        //   text: `Your one time password for signup is ${otp}. Thank you for joining with Adviserxiis.`, // plain text body
           html: htmlTemplateUser
        });

        const info2 = await transporter.sendMail({
            from: 'adviserxiis@gmail.com', // sender address
            to: adviser.email, // list of receivers
            subject: "Appointment Confirmation", // Subject line
          //   text: `Your one time password for signup is ${otp}. Thank you for joining with Adviserxiis.`, // plain text body
             html: htmlTemplateAdviser
          });


 
            saveMeetingId(paymentid, meetingid)
        // console.log("Message sent: %s", info.messageId);
        // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>

        res.status(200).json("Email send Successfully")

        
      }
      
      sendConfirmationMail().catch(console.error);
    
} 

export { sendConfirmationMail }