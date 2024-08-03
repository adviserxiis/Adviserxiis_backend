import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { ref as sRef, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL, getStorage, uploadBytes } from 'firebase/storage'


const storage = getStorage()

const upload = multer({ storage: multer.memoryStorage() });

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.log("Error hashing password:", error);
  }
};

async function getAdviser(adviserid) {
  // const nodeRef = ref(database, `advisers/${userId}`);
  try {
    // const snapshot = await get(nodeRef)
    const snapshot = await database.ref(`advisers/${adviserid}`).once('value')
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


const isUserExist = async (email, mobileNumber) => {
  let userFound = false;
  try {
    const snapshot = await database.ref('advisers').once('value');
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === email || userData.mobile_number === mobileNumber) {
          userFound = true;
        }
      });
    }
  } catch (error) {
    throw new Error('Error checking user existence');
  }
  return userFound;
};

const loginAdviser = async (req, res) =>{
    const { email, password } = req.body;
    try {
      const snapshot = await database.ref('advisers').once('value');
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
                const adviserId = childSnapshot.key;
                // Store adviserId in the session or send it in the response
                res.status(200).json({ message: 'Login successful', adviserId });
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

const signupAdviser = async (req, res) => {
  const { name, email, mobile_number, password, state } = req.body;

  
  if (!name || !email || !mobile_number || !password || !state) {
    return res.status(400).json({ error: 'Fill all the details' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const userExists = await isUserExist(email, mobile_number);

    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email or mobile number' });
    }

    const userid = uuidv1();
    const date = new Date().toString();



    await database.ref('advisers/' + userid).set({
      username: name,
      email: email,
      mobile_number: mobile_number,
      password: hashedPassword,
      state: state,
      created_at: date,

    });

    res.status(201).json({ message: 'Adviser registered successfully', adviserId: userid});
  } catch (error) {
    console.error('Error during adviser signup:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};


const saveProfessionalDetails = async (req, res) => {
  const { adviserid, professional_title, years_of_experience, education, industry, professional_bio } = req.body;


  if( !adviserid )
  {
    return res.status(400).json({ error: 'Provide the adviserid' });
  }

 else if( !adviserid || !professional_title || !years_of_experience || !education || !industry || !professional_bio)
 {
  return res.status(400).json({ error: 'Fill all the details' });
 }

  try {
    await database.ref('advisers/' + adviserid).update({
      professional_title,
      years_of_experience,
      education,
      industry,
      professional_bio,


    });

    res.status(200).json({ message: 'Professinal Details Saved successfully' });
  } catch (error) {
    console.error('Error in saving professional details:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};

const saveBankDetails = async (req, res) => {
  const { adviserid, bank_name, account_holder_name, account_number, ifsc_code, branch_name } = req.body;


  if( !adviserid )
  {
    return res.status(400).json({ error: 'Provide the adviserid' });
  }

 else if(  !adviserid || !bank_name || !account_holder_name || !account_number || !ifsc_code || !branch_name)
 {
  return res.status(400).json({ error: 'Fill all the details' });
 }


  try {
    await database.ref('advisers/' + adviserid).update({
      bank_name,
      account_holder_name,
      account_number,
      ifsc_code,
      branch_name,


    });

    res.status(200).json({ message: 'Bank Details Saved successfully' });
  } catch (error) {
    console.error('Error in saving bank details:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};


 const documentUpload = async (req, res) => {
  const { adviserid } = req.body;
  const files = req.files;

  console.log("req", req.body)
  console.log("filess", req.files)

  if (!adviserid || !files) {
    return res.status(400).json({ error: 'Adviser ID and files are required' });
  }

  const fileKeys = ['profile_photo', 'aadhar_front', 'aadhar_back'];
  const uploadPromises = [];

  async function uploadFiles() {
    for (const key of fileKeys) {
      if (files[key]) {
        console.log("hiii")
        console.log("key", key)
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
    const updateData = {};

    console.log("urls", urls);

    fileKeys.forEach((key, index) => {
      if (files[key]) {
        updateData[key] = urls[index]; 
      }
    });

    await database.ref('advisers/' + adviserid).update(updateData);


    res.status(200).json({ message: 'Files uploaded and data updated successfully', urls: updateData });
  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};

const verifyOTP = async (req, res) =>{
  const { adviserid, otp } = req.body;

   if( !adviserid || !otp )
    {
     return res.status(400).json({ error: 'Fill all the details' });
    }

  try {
    const user = await getAdviser(adviserid);
    
    if (user && otp === user.otp) {
      // OTP is correct, update the user's verification status
      // await update(ref(database, 'advisers/' + userId), {
      //   isVerified: true
      // });

      await database.ref('advisers/' + adviserid).update({
        isVerified: true
      });

      res.status(200).json({
        message: 'OTP Verified Successfully!',
        isVerified: true
      });
    } else {
      // OTP is incorrect
      res.status(400).json({
        message: 'Wrong OTP!',
        isVerified: false
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
}

const getAdviserDetails = async (req, res) => {
  const adviserId = req.params.adviserId;

  try {
    const snapshot = await database.ref(`advisers/${adviserId}`).once('value');
    if (snapshot.exists()) {
      res.status(200).json(snapshot.val());
    } else {
      res.status(404).json({ message: 'No data available' });
    }
  } catch (error) {
    console.error('Error fetching adviser details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export {
    loginAdviser,
    signupAdviser,
    saveProfessionalDetails,
    saveBankDetails,
    upload,
    documentUpload,
    verifyOTP,
    getAdviserDetails
}