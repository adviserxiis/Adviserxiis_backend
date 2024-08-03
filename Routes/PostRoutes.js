import { Router } from "express";
import { getAllPostsWithAdviser } from "../Controllers/PostController.js";


const router = new Router();

router.route('/getallpostswithadviserdetails').get(getAllPostsWithAdviser)


export default router;