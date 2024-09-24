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


// const getAllPostsWithAdviser = async(req, res)=>{
//     const nodeRef = database.ref('advisers_posts');

//     try {
//       const snapshot = await nodeRef.once('value');
//       if (snapshot.exists()) {
//         const posts = [];
//         snapshot.forEach(childSnapshot => {
//           posts.push({ data: childSnapshot.val(), id: childSnapshot.key });
//         });
  
//         const details = await Promise.all(
//           posts.map(async (post) => {
//             const adviser = await getAdviser(post.data.adviserid);
//             return { ...post, adviser };
//           })
//         );
  

//         details.sort((a, b) => {
//           const dateA = new Date(a.data.dop).getTime();
//           const dateB = new Date(b.data.dop).getTime();
//           return dateB - dateA;
//         });
  
//         res.status(200).json(details);
//       } else {
//         console.log('No data available');
//         res.status(200).json([]);
//       }
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
// }

const getAllReelsWithAdviser = async (req, res) => {
  const nodeRef = database.ref('advisers_posts');

  try {
    const snapshot = await nodeRef.once('value');
    if (snapshot.exists()) {
      const posts = [];
      
      // Filter posts with file_type = "video"
      snapshot.forEach(childSnapshot => {
        const postData = childSnapshot.val();
        if (postData.file_type === "video") {
          posts.push({ data: postData, id: childSnapshot.key });
        }
      });

      const details = await Promise.all(
        posts.map(async (post) => {
          const adviser = await getAdviser(post.data.adviserid);
          return { ...post, adviser };
        })
      );

      // Sort by date
      details.sort((a, b) => {
        const dateA = new Date(a.data.dop).getTime();
        const dateB = new Date(b.data.dop).getTime();
        return dateB - dateA;
      });

      res.status(200).json(details);
    } else {
      console.log('No data available');
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const getAllPostsForHome = async (req, res) => {
  const nodeRef = database.ref('advisers_posts');

  try {
    const snapshot = await nodeRef.once('value');
    if (snapshot.exists()) {
      const posts = [];
      
      // Filter posts with file_type = "video"
      snapshot.forEach(childSnapshot => {
        const postData = childSnapshot.val();
        if (postData.file_type !== "video" && postData.file_type !== "contest_video") {
          posts.push({ data: postData, id: childSnapshot.key });
        }
        
      });

      const details = await Promise.all(
        posts.map(async (post) => {
          const adviser = await getAdviser(post.data.adviserid);
          return { ...post, adviser };
        })
      );

      // Sort by date
      details.sort((a, b) => {
        const dateA = new Date(a.data.dop).getTime();
        const dateB = new Date(b.data.dop).getTime();
        return dateB - dateA;
      });

      res.status(200).json(details);
    } else {
      console.log('No data available');
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
      return res.status(200).json({ message: 'User has already liked this post' });
    }

    const updatedLikes = [...currentLikes, userid];
    

    await database.ref(`advisers_posts/${postid}`).update({ likes: updatedLikes });

    return res.status(200).json({ message: 'Post liked successfully'});
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

    return res.status(200).json({ message: 'Like removed successfully', });
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
        if ( postData.adviserid === adviserId && postData.file_type === "video") {
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
      posts.sort((a, b) => {
        const dateA = new Date(a.data.dop).getTime();
        const dateB = new Date(b.data.dop).getTime();
        return dateB - dateA;
      });

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

const getAllHomePostsOfAdviser = async (req, res) => {
  const nodeRef = database.ref('advisers_posts');
  const adviserId = req.params.adviserid;

  try {
    const snapshot = await nodeRef.once('value');
    if (snapshot.exists()) {
      const posts = [];
      snapshot.forEach(childSnapshot => {
        const postData = childSnapshot.val();
        if ( postData.adviserid === adviserId && postData.file_type !== "video") {
          posts.push({ data: postData, id: childSnapshot.key });
        }
      });

      const details = await Promise.all(
        posts.map(async (post) => {
          const adviser = await getAdviser(post.data.adviserid);
          return { ...post, adviser };
        })
      );

      // // Sort by date (latest posts first)
      details.sort((a, b) => {
        const dateA = new Date(a.data.dop).getTime();
        const dateB = new Date(b.data.dop).getTime();
        return dateB - dateA;
      });

      res.status(200).json(details);
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
  const { adviserid, description, location, videoURL,fileType, duration,luitags } = req.body;

  if (!adviserid || !videoURL || !fileType ||!duration) {
      return res.status(400).json({ error: 'Adviser ID , video file and fileType are required' });
  }

  try {
      const postid = uuidv1();
      // const fileRef = sRef(storage, `posts/${postid}`);
      // const metadata = {
      //     contentType: file.mimetype,
      // };

      // const snapshot = await uploadBytes(fileRef, file.buffer, metadata);
      // const downloadURL = await getDownloadURL(snapshot.ref);

      // const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';

      const postData = {
          adviserid: adviserid,
          post_file: videoURL,
          file_type: fileType,
          video_duration:duration,
          dop: new Date().toString(),
          views: [],
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

        if(luitags)
          {
            postData.luitags = luitags
          }

      await database.ref('advisers_posts/' + postid).set(postData);

      const adviserData = await getAdviser(adviserid)
      const currentPosts = adviserData.data.posts || []; // Retrieve existing IDs or initialize to an empty array

      // Add the new ID to the array
      const updatedPosts = [...currentPosts, postid];

      // Update the array field in the database
      await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });



      res.status(200).json({ message: 'Video uploaded and data saved successfully' , postData});
  } catch (error) {
      console.error('Error during video upload:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};


const createTextPost = async (req, res) => {
  const { adviserid, message, luitags  } = req.body;

  // Validate required fields
  if (!adviserid || !message) {
    return res.status(400).json({ error: 'Adviser ID and message are required' });
  }

  try {
    const postid = uuidv1();

    // Create the post data for a text post
    const postData = {
      adviserid: adviserid,
      description: message,
      file_type: 'text', // Indicate this is a text post
      dop: new Date().toString(),
      views: [],
      likes: [],
    };

    if (luitags) {
      postData.luitags = luitags;
    }

    // Save the post in the 'advisers_posts' node
    await database.ref('advisers_posts/' + postid).set(postData);

    // Retrieve the current adviser data
    const adviserData = await getAdviser(adviserid);
    const currentPosts = adviserData.data.posts || []; // Retrieve existing post IDs or initialize to an empty array

    // Add the new post ID to the adviser's posts array
    const updatedPosts = [...currentPosts, postid];

    // Update the adviser's post list in the 'advisers' node
    await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });

    res.status(200).json({ message: 'Text post created and data saved successfully' ,postData});
  } catch (error) {
    console.error('Error during text post creation:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};


// const createImagePost = async (req, res) => {
//   const { adviserid, description } = req.body;
//   const file = req.file; 

//   if (!adviserid || !file) {
//     return res.status(400).json({ error: 'Adviser ID and image file are required' });
//   }

//   try {
//     const postid = uuidv1();
//     const storage = getStorage();
    
  
//     const uniqueFileName = `${postid}_${Date.now()}_${file.originalname}`;
//     const fileRef = sRef(storage, `posts/${postid}/${uniqueFileName}`); 

//     const snapshot = await uploadBytes(fileRef, file.buffer);
//     const imageUrl = await getDownloadURL(snapshot.ref); 


//     const postData = {
//       adviserid: adviserid,
//       post_file: imageUrl,
//       file_type: 'image',
//       dop: new Date().toString(),
//       views: [],
//       likes: [],
//     };

//     if (description) {
//       postData.description = description;
//     }

//     await database.ref('advisers_posts/' + postid).set(postData);


//     const adviserData = await getAdviser(adviserid);
//     const currentPosts = adviserData.data.posts || [];

//     const updatedPosts = [...currentPosts, postid];

//     await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });

//     res.status(200).json({ message: 'Image uploaded and data saved successfully' ,postData});
//   } catch (error) {
//     console.error('Error during image upload:', error);
//     res.status(500).json({ error: 'Something went wrong. Please try again later.' });
//   }
// };


const createImagePost = async (req, res) => {
  const { adviserid, description , luitags} = req.body;
  const files = req.files; // Array of image files (handled by multer)

  if (!adviserid || !files || files.length === 0) {
    return res.status(400).json({ error: 'Adviser ID and at least one image file are required' });
  }

  try {
    const postid = uuidv1(); // Generate unique post ID
    const storage = getStorage();

    // 1. Use Promise.all to parallelize file uploads
    const uploadPromises = files.map(async (file) => {
      const uniqueFileName = `${postid}_${Date.now()}_${file.originalname}`;
      const fileRef = sRef(storage, `posts/${postid}/${uniqueFileName}`);
      const snapshot = await uploadBytes(fileRef, file.buffer);
      return getDownloadURL(snapshot.ref); // Return the URL of each uploaded image
    });

    // Wait for all image uploads to complete
    const imageUrls = await Promise.all(uploadPromises);

    // 2. Batch database updates to reduce individual calls
    const postData = {
      adviserid: adviserid,
      post_file: imageUrls, // Array of image URLs
      file_type: 'image', // Update to reflect multiple images
      dop: new Date().toString(),
      views: [],
      likes: [],
    };

    if (description) {
      postData.description = description;
    }

    if (luitags) {
      postData.luitags = luitags;
    }

    // Save the post data to Firebase Realtime Database
    const postUpdatePromise = database.ref('advisers_posts/' + postid).set(postData);

    // Fetch current posts and update adviser's post list in parallel
    const adviserData = await getAdviser(adviserid);
    const currentPosts = adviserData.data.posts || [];
    const updatedPosts = [...currentPosts, postid];
    const adviserUpdatePromise = database.ref('advisers/' + adviserid).update({ posts: updatedPosts });

    // Wait for both database operations to complete
    await Promise.all([postUpdatePromise, adviserUpdatePromise]);

    // 3. Return the response as soon as all operations are done
    res.status(200).json({ message: 'Images uploaded and post created successfully', postData });

  } catch (error) {
    console.error('Error during image upload:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};





// const createVideoPost = async (req, res) => {
//   const { adviserid, videoURL, duration, description } = req.body;

//   // Validate required fields
//   if (!adviserid || !videoURL || !duration) {
//     return res.status(400).json({ error: 'Adviser ID, videoURL and Video duration are required',postData });
//   }

//   try {
//     const postid = uuidv1();
//     const postData = {
//       adviserid: adviserid,
//       post_file: videoURL,
//       file_type: 'long_video',
//       video_duration:duration,
//       dop: new Date().toString(),
//       views: [],
//       likes: [],
//     };   
//     if(description)
//       {
//         postData.description = description
//       }

//     await database.ref('advisers_posts/' + postid).set(postData);

//     const adviserData = await getAdviser(adviserid);
//     const currentPosts = adviserData.data.posts || []; 

//     const updatedPosts = [...currentPosts, postid];
//     await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });

//     res.status(200).json({ message: 'Video post created and data saved successfully'});
//   } catch (error) {
//     console.error('Error during Video post creation:', error);
//     res.status(500).json({ error: 'Something went wrong. Please try again later.' });
//   }
// };

const createVideoPost = async (req, res) => {
  const { adviserid, videoURLs, durations, description,luitags } = req.body;

  // Validate required fields
  if (!adviserid || !videoURLs || !durations || videoURLs.length === 0 || durations.length === 0) {
    return res.status(400).json({ error: 'Adviser ID, at least one video URL, and corresponding duration are required' });
  }

  try {
    const postid = uuidv1(); // Generate unique post ID
    const videos_array = []; // Array to store video URLs and their durations

    // Loop through each video URL and its corresponding duration
    videoURLs.forEach((videoURL, index) => {
      const videoDuration = durations[index] || null; // Get duration or set to null if missing
      videos_array.push({
        video_url: videoURL,
        video_duration: videoDuration,
      });
    });

    // Create post data object
    const postData = {
      adviserid: adviserid,
      file_type: 'long_video', // Indicating that it's a post with multiple videos
      post_file: videos_array, // Array of video URLs with their durations
      dop: new Date().toString(),
      views: [],
      likes: [],
    };

    // Optionally add a description
    if (description) {
      postData.description = description;
    }
    if (luitags) {
      postData.luitags = luitags;
    }

    // Save the post data to the database
    await database.ref('advisers_posts/' + postid).set(postData);

    // Update the adviser's post list
    const adviserData = await getAdviser(adviserid);
    const currentPosts = adviserData.data.posts || [];
    const updatedPosts = [...currentPosts, postid];
    await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });

    res.status(200).json({ message: 'Video post created and data saved successfully', postData });
  } catch (error) {
    console.error('Error during Video post creation:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};


const createMediaPost = async (req, res) => {
  const { adviserid, description, videoURLs, duration } = req.body;
  const imageFiles = req.files; // Array of image files (handled by multer)

  if (!adviserid || (!imageFiles && !videoURLs)) {
    return res.status(400).json({ error: 'Adviser ID, at least one image or video is required' });
  }

  try {
    const postid = uuidv1(); // Generate unique post ID
    const storage = getStorage();
    const images_array = []; // Array to store image URLs
    const videos_array = []; // Array to store video URLs and their durations

    // Handle image uploads (if provided)
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        const uniqueFileName = `${postid}_${Date.now()}_${file.originalname}`;
        const fileRef = sRef(storage, `posts/${postid}/${uniqueFileName}`);

        const snapshot = await uploadBytes(fileRef, file.buffer);
        const imageUrl = await getDownloadURL(snapshot.ref);

        // Push each uploaded image URL to images_array
        images_array.push(imageUrl);
      }
    }

    // Handle video URLs (if provided)
    if (videoURLs && videoURLs.length > 0) {
      videoURLs.forEach((videoURL, index) => {
        // Push each video URL and corresponding duration to videos_array
        videos_array.push({
          video_url: videoURL,
          video_duration: duration[index] || null, // Assuming 'duration' is an array
        });
      });
    }

    // Create post data object
    const postData = {
      adviserid: adviserid,
      file_type: 'media',
      images_array: images_array,  // Array of image URLs
      videos_array: videos_array,  // Array of video URLs with their durations
      dop: new Date().toString(),
      views: [],
      likes: [],
    };

    if (description) {
      postData.description = description;
    }

    // Save the post data to the database
    await database.ref('advisers_posts/' + postid).set(postData);

    // Update the adviser's post list
    const adviserData = await getAdviser(adviserid);
    const currentPosts = adviserData.data.posts || [];
    const updatedPosts = [...currentPosts, postid];
    await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });

    res.status(200).json({ message: 'Post created and media uploaded successfully', postData });
  } catch (error) {
    console.error('Error during media post creation:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};


const sharePost = async (req, res) =>{
  const { postid } = req.body

  if (!postid) {
    return res.status(400).json({ error: 'Postid is required!!' });
}

  try {
      
    const sharelink = `https://www.adviserxiis.com/post/${postid}`
       
    res.status(200).json({ sharelink:sharelink });
    
  } catch (error) {
     console.log("error", error)
     res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
}

const addViews = async (req, res) =>{
  const { userid, postid } = req.body;

  if (!userid) {
    return res.status(401).json({ error: 'You must be logged in to like the post!' });
  }

  try {
    const postData = await getPost(postid);
    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }
    let currentViews = postData.views;

    // Check if views is an integer
    if (typeof currentViews === 'number') {
      // Treat it as an empty array if it's an integer
      currentViews = [];
    }
  
    // If it's not an integer and not an array, initialize it as an empty array
    if (!Array.isArray(currentViews)) {
      currentViews = [];
    }

    if (currentViews.includes(userid)) {
      return res.status(200).json({ message:'views count updated successfully!!' });
    }

    const updatedViews = [...currentViews, userid];
    await database.ref(`advisers_posts/${postid}`).update({ views: updatedViews });

    return res.status(200).json({ message: 'views count updated successfully!!' });
  } catch (error) {
    console.error('Error updating views:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


const deletePost = async(req, res) =>{
  const { postid, adviserid } = req.body;

  // Validate input
  if (!postid || !adviserid) {
    return res.status(400).json({ error: 'Post ID and Adviser ID are required' });
  }

  try {

    // Remove the post from 'advisers_posts'
    await database.ref(`advisers_posts/${postid}`).remove();

    // Fetch the adviser's data
    const adviserRef = database.ref(`advisers/${adviserid}`);
    const snapshot = await adviserRef.get();

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Adviser not found' });
    }

    const adviserData = snapshot.val();
    const currentPosts = adviserData.posts || [];

    // Filter out the deleted post ID
    const updatedPosts = currentPosts.filter(id => id !== postid);

    // Update the adviser's post list in the database
    await adviserRef.update({ posts: updatedPosts });

    return res.status(200).json({ message: 'Post deleted successfully'});
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the post' });
  }
}

const addComment = async (req, res) => {
  const { adviserid, postid, message } = req.body;
  
  if (!adviserid || !postid || !message) {
    return res.status(400).json({ error: 'Adviser ID, Post ID and message are required' });
  }

  try {
    const postRef = database.ref(`advisers_posts/${postid}`);
    const postSnapshot = await postRef.once('value');

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postData = postSnapshot.val();
    const currentComments = postData.comments || [];
    const date = new Date().toString();

    const newComment = {
      message: message,
      adviserid: adviserid,
      date: date,
      likes: [] 
    };

    currentComments.push(newComment);

    await postRef.update({ comments: currentComments });
    return res.status(200).json({ message: 'Comment added successfully',});

  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ error: 'An error occurred while adding the comment' });
  }
};

const deleteComment = async (req, res) => {
  const { postid, commentIndex } = req.body;

  if (!postid || commentIndex === undefined) {
    return res.status(400).json({ error: 'Post ID and comment index are required' });
  }

  try {
    const postRef = database.ref(`advisers_posts/${postid}`);
    const postSnapshot = await postRef.once('value');

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postData = postSnapshot.val();
    const currentComments = postData.comments || [];

    // Reverse the array to match the order of comments displayed in frontend
    const originalOrderComments = [...currentComments].reverse();

    // Check if the index is within bounds
    if (commentIndex >= originalOrderComments.length || commentIndex < 0) {
      return res.status(400).json({ error: 'Invalid comment index' });
    }

    // Remove the comment at the given index
    originalOrderComments.splice(commentIndex, 1);

    // Reverse back to the original order to save in Firebase
    const updatedComments = originalOrderComments.reverse();

    // Update the comments array in the database
    await postRef.update({ comments: updatedComments });

    return res.status(200).json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the comment' });
  }
};


const fetchCommentsWithAdviserDetails = async (req, res) => {
  const { postid } = req.params;

  if (!postid) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    // Get post comments from the post
    const postRef = database.ref(`advisers_posts/${postid}`);
    const postSnapshot = await postRef.once('value');

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postData = postSnapshot.val();
    const comments = postData.comments || [];

    // Reverse the comments array so the last comment appears at the top
    const reversedComments = comments.reverse();

    // Fetch adviser details for each comment
    const commentsWithAdviserDetails = await Promise.all(
      reversedComments.map(async (comment) => {
        const adviserRef = database.ref(`advisers/${comment.adviserid}`);
        const adviserSnapshot = await adviserRef.once('value');

        if (adviserSnapshot.exists()) {
          const adviserData = adviserSnapshot.val();
          return {
            ...comment,
            adviserDetails: {
              id: comment.adviserid, // Using adviserid as the unique ID
              username: adviserData.username,
              professional_title: adviserData.professional_title,
              profile_photo: adviserData.profile_photo
            }
          };
        } else {
          // If the adviser does not exist, return the comment without adviser details
          return {
            ...comment,
            adviserDetails: null
          };
        }
      })
    );

    return res.status(200).json({ comments: commentsWithAdviserDetails });

  } catch (error) {
    console.error('Error fetching comments with adviser details:', error);
    return res.status(500).json({ error: 'An error occurred while fetching comments' });
  }
};



export {
    getAllReelsWithAdviser,
    addLike,
    removeLike,
    getAllPostsOfAdviser,
    getAllHomePostsOfAdviser,
    createPost,
    sharePost,
    addViews,
    deletePost,
    createTextPost,
    createImagePost,
    createVideoPost,
    getAllPostsForHome,
    createMediaPost,
    addComment,
    fetchCommentsWithAdviserDetails,
    deleteComment

}