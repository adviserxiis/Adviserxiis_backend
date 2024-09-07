import { Router } from "express";
import { addLike, addViews, createImagePost, createPost, createTextPost, createVideoPost, deletePost, getAllPosts, getAllPostsOfAdviser, getAllReelsWithAdviser, removeLike, sharePost } from "../Controllers/PostController.js";
import multer from 'multer';


const router = new Router();
const upload = multer();


router.route('/getallpostswithadviserdetails').get(getAllReelsWithAdviser)
router.route('/getallposts').get(getAllPosts)
router.route('/addlike').post(addLike)
router.route('/removelike').post(removeLike)
router.route('/getpostsofadviser/:adviserid').get(getAllPostsOfAdviser)
router.route('/createpost').post(createPost)
router.route('/sharepost').post(sharePost)
router.route('/addviews').post(addViews)
router.route('/deletepost').post(deletePost)
router.route('/createtextpost').post(createTextPost)
router.route('/createvideopost').post(createVideoPost)
router.post('/createimagePost', upload.single('image'), createImagePost);


export default router;