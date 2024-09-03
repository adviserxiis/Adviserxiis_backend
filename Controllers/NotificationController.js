
import { admin, database,latest_version } from "../firebaseAdmin.js";


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


  const sendNotificationToAllCreators = async (req, res) => {
    const { title, body } = req.body;
  
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }
  
    try {
      // Fetch all advisers from the database
      const advisersRef = database.ref('advisers');
      const snapshot = await advisersRef.once('value');
  
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'No advisers found.' });
      }
  
      const deviceTokens = [];
  
      // Loop through each adviser and collect the device tokens
      snapshot.forEach((childSnapshot) => {
        const adviserData = childSnapshot.val();
        if (adviserData.device_token) {
          deviceTokens.push(adviserData.device_token);
        }
      });
  
      if (deviceTokens.length === 0) {
        return res.status(404).json({ error: 'No device tokens found for advisers.' });
      }
  
      // Prepare and send notification to each adviser
      const sendPromises = deviceTokens.map((token) => {
        const message = {
          notification: {
            title: title,
            body: body,
          },
          data: {
            latest_version: latest_version, // Add custom data here
          },
          token: token,
        };
  
        return admin.messaging().send(message);
      });
  
      // // Wait for all notifications to be sent
      const responses = await Promise.all(sendPromises);
  
      console.log('Notifications sent successfully:', responses);
      res.status(200).json({ message: 'Notifications sent successfully', responses });
  
    } catch (error) {
      console.error('Error sending notifications:', error);
      res.status(500).json({ message: 'Error sending notifications', error });
    }
  };
  


  export {
    sendNotification,
    sendNotificationToAllCreators
  }