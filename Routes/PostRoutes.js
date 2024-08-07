import { Router } from "express";
import { addLike, getAllPostsOfAdviser, getAllPostsWithAdviser, removeLike } from "../Controllers/PostController.js";


const router = new Router();


router.route('/getallpostswithadviserdetails').get(getAllPostsWithAdviser)
router.route('/addlike').post(addLike)
router.route('/removelike').post(removeLike)
router.route('/getpostsofadviser/:adviserid').get(getAllPostsOfAdviser)


export default router;