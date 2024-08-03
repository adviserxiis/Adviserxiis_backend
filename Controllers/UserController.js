import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { ref as sRef, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL, getStorage, uploadBytes } from 'firebase/storage'


const storage = getStorage()


const loginUser = async(req, res)=>{
    const { mobile_number, name } = req.body;

  
    if( !mobile_number )
        {
         return res.status(400).json({ error: 'Mobile number not found' });
        }
     
    const usersRef = database.ref('users');
    const date = new Date().toString();
  
    try {
      // Search for user by mobile number
      const snapshot = await usersRef.once('value');
      let userExists = false;
      let userid = null;
  
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.mobile_number == mobile_number) {
            userid = childSnapshot.key;
            userExists = true;
            return true; // Exit loop early
          }
        });
      }
  
      if (!userExists) {
        userid = uuidv1();
        const newUser = {
          mobile_number: mobile_number,
          created_at: date,
        };
        if (name && name !== '' ) {
          newUser.username = name;
        }

  
        await usersRef.child(userid).set(newUser);
      } else if (name && name !== '') {
        await usersRef.child(userid).update({
          username: name,
        });
      }
  
      res.status(200).json({ message: 'User login successfully', userid });
    } catch (error) {
      console.error('Error processing user:', error);
      res.status(500).json({ error: 'Something went wrong!' });
    }
}


export {
  loginUser
}