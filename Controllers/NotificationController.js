
import { admin, database } from "../firebaseAdmin.js";


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



  // const sendNotificationToAllCreators = async (req, res) => {
  //   const { title, body, latest_version } = req.body;
  
  //   if (!title || !body || !latest_version) {
  //     return res.status(400).json({ error: 'Title, body, and latest_version are required.' });
  //   }
  
  //   try {
  //     const advisersRef = database.ref('advisers');
  //     const snapshot = await advisersRef.once('value');
  
  //     if (!snapshot.exists()) {
  //       return res.status(404).json({ error: 'No advisers found.' });
  //     }
  
  //     let deviceTokens = [];
  
  //     snapshot.forEach((childSnapshot) => {
  //       const adviserData = childSnapshot.val();
  //       if (adviserData.device_token) {
  //         deviceTokens.push(adviserData.device_token);
  //       }
  //     });
  
  //     // Remove duplicate tokens
  //     deviceTokens = [...new Set(deviceTokens)];

  //     // console.log("device_token", deviceTokens)
  
  //     if (deviceTokens.length === 0) {
  //       return res.status(404).json({ error: 'No device tokens found for advisers.' });
  //     }
  

      
  //     const sendPromises = deviceTokens.map((token) => {
  //       const message = {
  //         notification: {
  //           title: title,
  //           body: body,
  //         },
  //         data: {
  //           latest_version: latest_version,
  //         },
  //         token: token,
  //       };
  
  //       return admin.messaging().send(message).catch((error) => {
  //         if (error.code === 'messaging/registration-token-not-registered') {
  //           console.warn(`Token not registered: ${token}`);
  //           // Optionally remove invalid token from database here
  //         } else {
  //           throw error;
  //         }
  //       });
  //     });
  
  //     const responses = await Promise.all(sendPromises);
  
  //     // console.log('Notifications sent successfully:', responses);
  //     res.status(200).json({ message: 'Notifications sent successfully', responses });
  
  //   } catch (error) {
  //     console.error('Error sending notifications:', error);
  //     res.status(500).json({ message: 'Error sending notifications', error });
  //   }
  // };

  const sendNotificationToAllCreators = async (req, res) => {
    const { title, body, latest_version } = req.body;
  
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }
  
    try {
      const advisersRef = database.ref('advisers');
      const snapshot = await advisersRef.once('value');
  
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'No advisers found.' });
      }
  
      let deviceTokens = [];
  
      snapshot.forEach((childSnapshot) => {
        const adviserData = childSnapshot.val();
        if (adviserData.device_token) {
          deviceTokens.push(adviserData.device_token);
        }
      });
  
      // Remove duplicate tokens
      deviceTokens = [...new Set(deviceTokens)];
  
      if (deviceTokens.length === 0) {
        return res.status(404).json({ error: 'No device tokens found for advisers.' });
      }
  
      const sendPromises = deviceTokens.map((token) => {
        // Build the notification message
        const message = {
          notification: {
            title: title,
            body: body,
          },
          token: token,
        };
  
        // If latest_version exists, add it to the data field
        if (latest_version) {
          message.data = {
            latest_version: latest_version,
          };
        }
  
        // Send the notification
        return admin.messaging().send(message).catch((error) => {
          if (error.code === 'messaging/registration-token-not-registered') {
            console.warn(`Token not registered: ${token}`);
            // Optionally remove invalid token from database here
          } else {
            throw error;
          }
        });
      });
  
      const responses = await Promise.all(sendPromises);
  
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