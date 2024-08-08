import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { ref as sRef, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL, getStorage, uploadBytes } from 'firebase/storage'

const storage = getStorage()

const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        console.log("Error hashing password:", error);
    }
};


const isUserExist = async (email) => {
    let userFound = false;
    try {
        const snapshot = await database.ref('test').once('value');
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.email === email) {
                    userFound = true;
                }
            });
        }
    } catch (error) {
        throw new Error('Error checking user existence');
    }
    return userFound;
};

const signUp = async (req, res) => {
    const { email, password } = req.body;
    const userid = uuidv1();

    if (!email || !password) {
        return res.status(400).json({ error: 'All Fields are required!!' });
    }

    try {

        const hashedPassword = await hashPassword(password);
        const userExists = await isUserExist(email);
    
        if (userExists) {
          return res.status(400).json({ error: 'User already exists with this email' });
        }

        const userData = {
            email: email,
            password:hashedPassword,
        };

        await database.ref('test/' + userid).set(userData);
        res.status(200).json({ message: 'SignUp Successfully!!', userid: userid });
    } catch (error) {
        console.error('Error during signup', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}


const login = async (req, res)=>{
    const { email, password } = req.body;
    try {
      const snapshot = await database.ref('test').once('value');
      if (snapshot.exists()) {
        let userFound = false;
  
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData.email === email) {
            userFound = true;
            bcrypt.compare(password, userData.password, (err, isMatch) => {
              if (err) {
                return res.status(500).json({ error: 'Error comparing passwords' });
              }
              if (isMatch) {
                const userid = childSnapshot.key;
                // Store adviserId in the session or send it in the response
                res.status(200).json({ message: 'Login successful', userid });
              } else {
                res.status(401).json({ error: 'Invalid email or password' });
              }
            });
            return true; // Exit the forEach loop once the user is found
          }
        });
  
        if (!userFound) {
          res.status(404).json({ error: 'User not found' });
        }
      } else {
        res.status(404).json({ error: 'No data available' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}


const saveDetails = async (req, res) => {
    const files = req.files;
    const { userid } = req.body
    const jsonData = JSON.parse(req.body.data);

    if (!files || !userid || !jsonData.name || !jsonData.professional_title || !jsonData.discription || !jsonData.interests || !jsonData.social_links) {
        return res.status(400).json({ error: 'All Fields are required!!' });
    }

    const fileKeys = ['profile_photo', 'profile_background'];
    const uploadPromises = [];

    async function uploadFiles() {
        for (const key of fileKeys) {
            if (files[key]) {
                const file = files[key][0];
                const storageRef = sRef(storage, `images/${uuidv1()}`);
                const metadata = {
                    contentType: file.mimetype,
                };
                const snapshot = await uploadBytesResumable(storageRef, file.buffer, metadata);
                const downloadURL = await getDownloadURL(snapshot.ref);

                uploadPromises.push(Promise.resolve(downloadURL));
            }
        }
        const downloadURLs = await Promise.all(uploadPromises);
        return downloadURLs;
    }

    try {
        const urls = await uploadFiles();
        const userData = {
            name: jsonData.name,
            interests: jsonData.interests,
            social_links: jsonData.social_links,
            professional_title: jsonData.professional_title,
            discription: jsonData.discription,
        };
        fileKeys.forEach((key, index) => {
            if (files[key]) {
                userData[key] = urls[index];
            }
        });
        await database.ref('test/' + userid).update(userData);
        res.status(200).json({ message: 'Data Saved Successfully!!' });
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}


export {
    signUp,
    login,
    saveDetails
}