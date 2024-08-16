import { Router } from "express";
import { addLike, createPost, getAllPostsOfAdviser, getAllPostsWithAdviser, removeLike } from "../Controllers/PostController.js";
import multer from 'multer';


const router = new Router();
const upload = multer();


router.route('/getallpostswithadviserdetails').get(getAllPostsWithAdviser)
router.route('/addlike').post(addLike)
router.route('/removelike').post(removeLike)
router.route('/getpostsofadviser/:adviserid').get(getAllPostsOfAdviser)
router.route('/createpost').post(createPost)


export default router;