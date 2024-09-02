
import { admin } from "../firebaseAdmin.js";


const sendNotification = async (req, res) => {
    const { deviceToken, title, body } = req.body;
  
    if (!deviceToken || !title || !body) {
      return res.status(400).json({ error: 'Device token, title, and body are required.' });
    }
  
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: deviceToken,
    };
  
    try {
      const response = await admin.messaging().send(message);
      console.log('Notification sent successfully:', response);
      res.status(200).json({ message: 'Notification sent successfully', response });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ message: 'Error sending notification', error });
    }
  };


  export {
    sendNotification
  }