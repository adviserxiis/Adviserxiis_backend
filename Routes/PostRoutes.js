import { Router } from "express";
import { addComment, addLike, addViews, createImagePost, createMediaPost, createPost, createTextPost, createVideoPost, deleteComment, deletePost, fetchCommentsWithAdviserDetails, getAllHomePostsOfAdviser, getAllPostsForHome, getAllPostsOfAdviser, getAllReelsWithAdviser, removeLike, sharePost } from "../Controllers/PostController.js";
import multer from 'multer';


const router = new Router();
const upload = multer();


router.route('/getallpostswithadviserdetails').get(getAllReelsWithAdviser)
router.route('/getallposts').get(getAllPostsForHome)
router.route('/addlike').post(addLike)
router.route('/removelike').post(removeLike)
router.route('/getpostsofadviser/:adviserid').get(getAllPostsOfAdviser)
router.route('/gethomepostsofadviser/:adviserid').get(getAllHomePostsOfAdviser)
router.route('/createpost').post(createPost)
router.route('/sharepost').post(sharePost)
router.route('/addviews').post(addViews)
router.route('/deletepost').post(deletePost)
router.route('/createtextpost').post(createTextPost)
router.route('/createvideopost').post(createVideoPost)
// router.post('/createimagepost', upload.single('image'), createImagePost);
router.post('/createimagepost', upload.array('images'), createImagePost);
router.post('/createmediapost', upload.array('images'),createMediaPost);
router.route('/addcomment').post(addComment)
router.route('/deletecomment').post(deleteComment)
router.route('/fetchcomments/:postid').get(fetchCommentsWithAdviserDetails)


export default router;