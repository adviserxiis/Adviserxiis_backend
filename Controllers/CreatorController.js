import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { ref as sRef, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL, getStorage, uploadBytes } from 'firebase/storage'
import otpGenerator from 'otp-generator'
import nodemailer from 'nodemailer';

const storage = getStorage()

const generateOTP = () => {
    return otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });
};

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
        const snapshot = await database.ref('advisers').once('value');
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

const getUserId = async (email) => {
    let userid = null
    try {
        const snapshot = await database.ref('advisers').once('value');
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.email === email) {
                    userid = childSnapshot.key;
                }
            });
        }
    } catch (error) {
        throw new Error('Error checking user existence');
    }
    return userid;
};

async function getuserData(userid) {

    try {
      const snapshot = await database.ref(`advisers/${userid}`).once('value');
      if (snapshot.exists()) {
        return  snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching adviser details:', error);
      return null;
    }
  }

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
            password: hashedPassword,
        };

        await database.ref('advisers/' + userid).set(userData);
        res.status(200).json({ message: 'SignUp Successfully!!', userid: userid });
    } catch (error) {
        console.error('Error during signup', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}


const login = async (req, res) => {
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

    if ( !userid || !jsonData.name || !jsonData.professional_title || !jsonData.discription || !jsonData.interests ) {
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
            username: jsonData.name,
            interests: jsonData.interests,
            professional_title: jsonData.professional_title,
            professional_bio: jsonData.discription,
        };

                if (jsonData.social_links) {
            userData.social_links = jsonData.social_links;
        }

        fileKeys.forEach((key, index) => {
            if (files[key]) {
                userData[key] = urls[index];
            }
        });
        await database.ref('advisers/' + userid).update(userData);
        res.status(200).json({ message: 'Data Saved Successfully!!' });
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}

// const saveDetails = async (req, res) => {
//     try {
//         const files = req.files;
//         const { userid } = req.body;
//         const jsonData = JSON.parse(req.body.data);

//         // Validate mandatory fields
//         if (!userid || !jsonData.name || !jsonData.professional_title || !jsonData.discription || !jsonData.interests) {
//             return res.status(400).json({ error: 'userid, Name, Professional Title, Description, and Interests are required!' });
//         }

//         const fileKeys = ['profile_photo', 'profile_background'];
//         const uploadPromises = [];

//         // Optimize file uploads by parallelizing them
//         fileKeys.forEach(key => {
//             if (files[key]) {
//                 const file = files[key][0];
//                 const storageRef = sRef(storage, `images/${uuidv1()}`);
//                 const metadata = { contentType: file.mimetype };

//                 const uploadPromise = uploadBytesResumable(storageRef, file.buffer, metadata)
//                     .then(snapshot => getDownloadURL(snapshot.ref))
//                     .catch(error => {
//                         console.error(`Error uploading ${key}:`, error);
//                         throw new Error(`Failed to upload ${key}`);
//                     });

//                 uploadPromises.push(uploadPromise);
//             }
//         });

//         // Wait for all uploads to complete
//         const downloadURLs = await Promise.all(uploadPromises);

//         // Construct user data object with mandatory fields
//         const userData = {
//             username: jsonData.name,
//             interests: jsonData.interests,
//             professional_title: jsonData.professional_title,
//             professional_bio: jsonData.discription,
//         };

//         // Add social links if they exist
//         if (jsonData.social_links) {
//             userData.social_links = jsonData.social_links;
//         }

//         // Assign URLs to userData if files were uploaded
//         fileKeys.forEach((key, index) => {
//             if (files[key]) {
//                 userData[key] = downloadURLs[index];
//             }
//         });

//         // Update the database with user data
//         await database.ref('advisers/' + userid).update(userData);

//         // Send response after all operations are complete
//         res.status(200).json({ message: 'Data Saved Successfully!!' });
//     } catch (error) {
//         console.error('Error during saveDetails operation:', error);
//         res.status(500).json({ error: 'Something went wrong, Please try again.' });
//     }
// };




const getUserDetails = async (req, res) => {
    const userid = req.params.userid;

    try {
        const snapshot = await database.ref(`advisers/${userid}`).once('value');
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

const getUserByUsername = async (req, res) => {
    const key = req.params.key || '';

    try {
        const snapshot = await database.ref('advisers').once('value');
        const advisers = snapshot.val();

        if (!advisers) {
            return res.status(404).json({ message: 'No data available' });
        }

        // Filter users based on the key, or return the full list if the key is empty
        const filteredAdvisers = Object.values(advisers)
            .filter(adviser => key ? adviser.username.toLowerCase().includes(key.toLowerCase()) : true);

        res.status(200).json(filteredAdvisers);
    } catch (error) {
        console.error('Error fetching advisers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const sendResetPasswordOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required!!' });
    }

    try {
        const userid = await getUserId(email);

        if (!userid) {
            return res.status(400).json({ error: 'User does not exist with this email' });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 465,
            secure: true, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: "adviserxiis@gmail.com",
                pass: "ziwo lsoq xeaj vran",
            },
        });


        async function main() {
            const otp = generateOTP();
            await database.ref('advisers/' + userid).update({ change_password_otp: otp });
            const info = await transporter.sendMail({
                from: 'adviserxiis@gmail.com', // sender address
                to: email, // list of receivers
                subject: "OTP from Luink.ai", // Subject line
                text: `Your one time password for change passsword is ${otp}. Thank you for joining with Luink.ai.`, // plain text body
                //   html: "<b>Hello world?</b>",  html body
            });
            res.status(200).json({message:"OTP send successfully", userid:userid})
        }
        main();
    } catch (error) {
        console.error('Error during sending otp', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}


const verifyResetPasswordOtp = async (req, res) =>{
    const { userid, otp} = req.body

    if (!userid || !otp) {
        return res.status(400).json({ error: 'All fields are required!!' });
    }

    try {

        const userData = await getuserData(userid)
        if(otp == userData.change_password_otp)
        {
            res.status(200).json({message:"OTP verify Successfully", userid:userid})
        }
        else{
        res.status(400).json({message:"Wrong OTP"})
        }
 
    } catch (error) {
        console.error('Error during verify otp', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}


const resetPassword = async (req, res) =>{
       const { userid, password} = req.body

    if (!userid || !password) {
        return res.status(400).json({ error: 'All fields are required!!' });
    }

    try {
        const hashedPassword = await hashPassword(password);
        await database.ref('advisers/' + userid).update({ password:hashedPassword });

        res.status(200).json({message:"Password Changed Successfully", userid:userid})
    } catch (error) {
        console.error('Error during Reset Password', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}


const followCreator = async (req, res) =>{
    const { adviserid, followerid } = req.body;

    if (!adviserid || !followerid) {
      return res.status(400).json({ message: 'adviserId and followerId are required.' });
    }
  
    try {
      const adviser = await getuserData(adviserid);
      const follower = await getuserData(followerid);
  
      if (!adviser || !follower) {
        return res.status(404).json({ message: 'Adviser or Follower not found.' });
      }
  
      const currentFollowers = adviser.followers || [];
      const currentFollowings = follower.followings || [];
  
      if (!currentFollowers.includes(followerid)) {
        currentFollowers.push(followerid);
      }
  
      if (!currentFollowings.includes(adviserid)) {
        currentFollowings.push(adviserid);
      }
  
      const updates = {};
      updates[`advisers/${adviserid}/followers`] = currentFollowers;
      updates[`advisers/${followerid}/followings`] = currentFollowings;
  
      await database.ref().update(updates);
  
      return res.status(200).json({ message: 'Followed successfully.' });
    } catch (error) {
      console.error('Error following adviser:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
} 


const unfollowCreator = async (req, res) => {
    const { adviserid, followerid } = req.body;
  
    if (!adviserid || !followerid) {
      return res.status(400).json({ message: 'adviserId and followerId are required.' });
    }
  
    try {
      const adviser = await getuserData(adviserid);
      const follower = await getuserData(followerid);
  
      if (!adviser || !follower) {
        return res.status(404).json({ message: 'Adviser or Follower not found.' });
      }
  
      let currentFollowers = adviser.followers || [];
      let currentFollowings = follower.followings || [];
  
      currentFollowers = currentFollowers.filter(id => id !== followerid);
  
      currentFollowings = currentFollowings.filter(id => id !== adviserid);
  
      const updates = {};
      updates[`advisers/${adviserid}/followers`] = currentFollowers;
      updates[`advisers/${followerid}/followings`] = currentFollowings;
  
      await database.ref().update(updates);
  
      return res.status(200).json({ message: 'Unfollowed successfully.' });
    } catch (error) {
      console.error('Error unfollowing adviser:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }


const signinwithGoogle = async (req, res) =>{

    const { email } = req.body;

    if (!email ) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const userExists = await isUserExist(email);
        if (userExists) {
            const userid = await getUserId(email);
            return res.status(200).json({ message: 'Login Successfully!!', userid });
        }

        else{
            const userid = uuidv1();
            const userData = {
                email: email,
            };
            await database.ref('advisers/' + userid).set(userData);
            res.status(200).json({ message: 'Login Successfully!!', userid });
        }
    } catch (error) {
        console.error('Error during signin with google:', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
}
  


export {
    signUp,
    login,
    saveDetails,
    getUserDetails,
    getUserByUsername,
    sendResetPasswordOtp,
    verifyResetPasswordOtp,
    resetPassword,
    followCreator,
    unfollowCreator,
    signinwithGoogle
}