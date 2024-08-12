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

async function getPost(postid) {
    const nodeRef = database.ref(`advisers_posts/${postid}`);
    try {
      const snapshot = await nodeRef.get();
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

const addLike = async(req, res)=>{
  const { userid, postid } = req.body;

  if (!userid) {
    return res.status(401).json({ error: 'You must be logged in to like the post!' });
  }

  try {
    const postData = await getPost(postid);
    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const currentLikes = postData.likes || [];
    if (currentLikes.includes(userid)) {
      return res.status(400).json({ error: 'User has already liked this post' });
    }

    const updatedLikes = [...currentLikes, userid];
    

    await database.ref(`advisers_posts/${postid}`).update({ likes: updatedLikes });

    return res.status(200).json({ message: 'Post liked successfully', likes: updatedLikes });
  } catch (error) {
    console.error('Error updating likes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const removeLike = async(req, res)=>{
  const { userid, postid } = req.body;

  if (!userid) {
    return res.status(401).json({ error: 'You must be logged in to unlike the post!' });
  }

  try {
    const postData = await getPost(postid);
    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const currentLikes = postData.likes || [];
    if (!currentLikes.includes(userid)) {
      return res.status(400).json({ error: 'User has not liked this post' });
    }

    const updatedLikes = currentLikes.filter(id => id !== userid);

    await database.ref(`advisers_posts/${postid}`).update({ likes: updatedLikes });

    return res.status(200).json({ message: 'Like removed successfully', likes: updatedLikes });
  } catch (error) {
    console.error('Error updating likes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const getAllPostsOfAdviser = async (req, res) => {
  const nodeRef = database.ref('advisers_posts');
  const adviserId = req.params.adviserid;

  try {
    const snapshot = await nodeRef.once('value');
    if (snapshot.exists()) {
      const posts = [];
      snapshot.forEach(childSnapshot => {
        const postData = childSnapshot.val();
        if ( postData.adviserid === adviserId) {
          posts.push({ data: postData, id: childSnapshot.key });
        }
      });

      // const details = await Promise.all(
      //   posts.map(async (post) => {
      //     const adviser = await getAdviser(post.data.adviserid);
      //     return { ...post, adviser };
      //   })
      // );

      // // Sort by date (latest posts first)
      // details.sort((a, b) => {
      //   const dateA = new Date(a.data.dop).getTime();
      //   const dateB = new Date(b.data.dop).getTime();
      //   return dateB - dateA;
      // });

      res.status(200).json(posts);
    } else {
      console.log('No data available');
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPost = async (req, res) => {
  const { adviserid, description, location } = req.body;
  const file = req.file;

  if (!adviserid || !file) {
      return res.status(400).json({ error: 'Adviser ID and video file are required' });
  }

  try {
      const postid = uuidv1();
      const fileRef = sRef(storage, `posts/${postid}`);
      const metadata = {
          contentType: file.mimetype,
      };

      const snapshot = await uploadBytes(fileRef, file.buffer, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';

      const postData = {
          adviserid: adviserid,
          post_file: downloadURL,
          file_type: fileType,
          dop: new Date().toString(),
          views: 0,
          likes: [],
      };

      if(description)
      {
        postData.description = description
      }

      if(location)
        {
          postData.location = location
        }
      
      await database.ref('advisers_posts/' + postid).set(postData);

      const adviserData = await getAdviser(adviserid)
      const currentPosts = adviserData.data.posts || []; // Retrieve existing IDs or initialize to an empty array

      // Add the new ID to the array
      const updatedPosts = [...currentPosts, postid];

      // Update the array field in the database
      await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });



      res.status(200).json({ message: 'Video uploaded and data saved successfully', videoURL: downloadURL, updatedPosts, postData });
  } catch (error) {
      console.error('Error during video upload:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};

export {
    getAllPostsWithAdviser,
    addLike,
    removeLike,
    getAllPostsOfAdviser,
    createPost

}