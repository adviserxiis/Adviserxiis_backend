import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { ref as sRef, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL, getStorage, uploadBytes } from 'firebase/storage'


const storage = getStorage()

async function getAdviser(adviserId) {
    try {
      const snapshot = await database.ref(`advisers/${adviserId}`).once('value');
      if (snapshot.exists()) {
        return { data: snapshot.val(), id: adviserId };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching adviser details:', error);
      return null;
    }
  }


const getAllPostsWithAdviser = async(req, res)=>{
    const nodeRef = database.ref('advisers_posts');

    try {
      const snapshot = await nodeRef.once('value');
      if (snapshot.exists()) {
        const posts = [];
        snapshot.forEach(childSnapshot => {
          posts.push({ data: childSnapshot.val(), id: childSnapshot.key });
        });
  
        const details = await Promise.all(
          posts.map(async (post) => {
            const adviser = await getAdviser(post.data.adviserid);
            return { ...post, adviser };
          })
        );
  
        // Sort by date (latest posts first)
        details.sort((a, b) => {
          const dateA = new Date(a.data.dop).getTime();
          const dateB = new Date(b.data.dop).getTime();
          return dateB - dateA;
        });
  
        // const specificPostId = req.query.specificPostId;
        // if (specificPostId) {
        //   const postIndex = details.findIndex(post => post.id === specificPostId);
        //   if (postIndex !== -1) {
        //     const postToMove = details.splice(postIndex, 1)[0];
        //     details.unshift(postToMove);
        //   }
        // }
  
        res.status(200).json(details);
      } else {
        console.log('No data available');
        res.status(200).json([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
}

export {
    getAllPostsWithAdviser
}