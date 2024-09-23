import { Router } from 'express'
import { createContest, createContestReel, getContestLeaderboard, getOngoingContest } from '../Controllers/ContestController.js';


const router = new Router();

router.route('/getongoingcontest').get(getOngoingContest)
router.route('/createcontest').post(createContest)
router.route('/uploadcontestreel').post(createContestReel)
router.route('/getleaderboard/:contestid').get(getContestLeaderboard)

export default router