import { database } from '../firebaseAdmin.js'
import bcrypt from 'bcryptjs'
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { ref as sRef, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL, getStorage, uploadBytes } from 'firebase/storage'


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


const createContest = async (req, res) => {

    const { name, description, last_date, prize_money } = req.body;

    if (!name || !description || !last_date || !prize_money) {
        return res.status(400).json({ error: 'Contest name, description, last date, and prize money are required' });
    }

    try {
        const contestid = uuidv1();

        const contestData = {
            name: name,
            description: description,
            last_date: last_date,
            prize_money: prize_money,
            participants: []
        };

        await database.ref('creators_contests/' + contestid).set(contestData);

        return res.status(200).json({ message: 'Contest created successfully', contestid });

    } catch (error) {
        console.error('Error creating contest:', error);
        return res.status(500).json({ error: 'An error occurred while creating the contest.' });
    }
}


const getOngoingContest = async (req, res) => {
    try {
        const currentDate = new Date();

        const snapshot = await database.ref('creators_contests').once('value');
        const contests = snapshot.val();

        if (!contests) {
            return res.status(404).json({ error: 'No contests found' });
        }

        let ongoingContest = null;
        let ongoingContestId = null;

        Object.keys(contests).forEach((contestId) => {
            const contest = contests[contestId];
            const [day, month, year] = contest.last_date.split('-');
            const contestDate = new Date(`${year}-${month}-${day}T23:59:59`);

            if (contestDate >= currentDate) {
                ongoingContest = contest;
                ongoingContestId = contestId;
                return;
            }
        });

        if (!ongoingContest) {
            return res.status(404).json({ message: 'No ongoing contest at the moment' });
        }

        return res.status(200).json({ contestId: ongoingContestId, contestDetails: ongoingContest });

    } catch (error) {
        console.error('Error fetching ongoing contest:', error);
        return res.status(500).json({ error: 'An error occurred while fetching the ongoing contest.' });
    }
};

// const createContestReel = async (req, res) => {
//     const { adviserid, description, location, videoURL, duration, luitags, contestid } = req.body;

//     if (!adviserid || !videoURL || !duration || !contestid) {
//         return res.status(400).json({ error: 'Adviser ID, video url, duration, and contest ID are required' });
//     }

//     try {
//         const postid = uuidv1();
//         const postData = {
//             adviserid: adviserid,
//             contestid:contestid,
//             post_file: videoURL,
//             file_type: 'contest_reel',
//             video_duration: duration,
//             dop: new Date().toString(),
//             views: [],
//             likes: [],
//         };

//         if (description) {
//             postData.description = description;
//         }

//         if (location) {
//             postData.location = location;
//         }

//         if (luitags) {
//             postData.luitags = luitags;
//         }

//         await database.ref('advisers_posts/' + postid).set(postData);

//         const adviserData = await getAdviser(adviserid);
//         const currentPosts = adviserData.data.posts || [];
//         const updatedPosts = [...currentPosts, postid];

//         await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });


//         // const contestReelData = {
//         //     postid: postid,
//         //     adviserid: adviserid,
//         //     contestid: contestid,
//         // };

//         // await database.ref('contest_reel/' + postid).set(contestReelData);

//         const contestSnapshot = await database.ref('creators_contests/' + contestid).once('value');
//         const contestData = contestSnapshot.val();

//         if (contestData) {
//             const currentParticipants = contestData.participants || [];

//             if (!currentParticipants.includes(adviserid)) {
//                 currentParticipants.push(adviserid);
//                 await database.ref('creators_contests/' + contestid).update({ participants: currentParticipants });
//             }
//         } else {
//             return res.status(404).json({ error: 'Contest not found' });
//         }

//         res.status(200).json({ message: 'Contest reel uploaded and data saved successfully', postData, contestReelData });

//     } catch (error) {
//         console.error('Error during contest reel upload:', error);
//         res.status(500).json({ error: 'Something went wrong. Please try again later.' });
//     }
// };


const createContestReel = async (req, res) => {
    const { adviserid, description, location, videoURL, duration, luitags, contestid } = req.body;

    if (!adviserid || !videoURL || !duration || !contestid) {
        return res.status(400).json({ error: 'Adviser ID, video URL, duration, and contest ID are required' });
    }

    try {
        const postid = uuidv1();
        const postData = {
            adviserid: adviserid,
            contestid: contestid,
            post_file: videoURL,
            file_type: 'contest_video',
            video_duration: duration,
            dop: new Date().toString(),
            views: [],
            likes: [],
        };

        if (description) {
            postData.description = description;
        }

        if (location) {
            postData.location = location;
        }

        if (luitags) {
            postData.luitags = luitags;
        }

        // Save post data under 'advisers_posts'
        await database.ref('advisers_posts/' + postid).set(postData);

        // Get adviser data and update posts array
        const adviserData = await getAdviser(adviserid);
        const currentPosts = adviserData.data.posts || [];
        const updatedPosts = [...currentPosts, postid];

        await database.ref('advisers/' + adviserid).update({ posts: updatedPosts });

        // Add contest to adviser node under contests array
        const currentContests = adviserData.data.contests || [];
        if (!currentContests.includes(contestid)) {
            const updatedContests = [...currentContests, contestid];
            await database.ref('advisers/' + adviserid).update({ contests: updatedContests });
        }

        // Update contest participants in 'creators_contests'
        const contestSnapshot = await database.ref('creators_contests/' + contestid).once('value');
        const contestData = contestSnapshot.val();

        if (contestData) {
            const currentParticipants = contestData.participants || [];

            if (!currentParticipants.includes(adviserid)) {
                currentParticipants.push(adviserid);
                await database.ref('creators_contests/' + contestid).update({ participants: currentParticipants });
            }
        } else {
            return res.status(404).json({ error: 'Contest not found' });
        }

        res.status(200).json({ message: 'Contest reel uploaded and data saved successfully', postData });

    } catch (error) {
        console.error('Error during contest reel upload:', error);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
};


const getContestLeaderboard = async (req, res) => {
    const { contestid } = req.params;

    if (!contestid) {
        return res.status(400).json({ error: 'Contest ID is required' });
    }

    try {
        const postsSnapshot = await database.ref('advisers_posts').once('value');
        const postsData = postsSnapshot.val();

        if (!postsData) {
            return res.status(200).json({ message: 'Leaderboard fetched successfully', leaderboard: [] });
        }

        let leaderboard = [];

        for (const postid in postsData) {
            const post = postsData[postid];

            if (post.contestid === contestid) {
                const adviserSnapshot = await database.ref('advisers/' + post.adviserid).once('value');
                const adviserData = adviserSnapshot.val();

                if (adviserData) {
                    leaderboard.push({
                        postid: postid,
                        adviserid: post.adviserid,
                        name: adviserData.name,
                        professional_title: adviserData.professional_title,
                        post_file: post.post_file,
                        likes: post.likes,
                        description: post.description || '',
                        location: post.location || '',
                        luitags: post.luitags || [],
                        dop: post.dop,
                        video_duration: post.video_duration,
                        views: post.views,
                    });
                }
            }
        }

        leaderboard.sort((a, b) => b.likes.length - a.likes.length);

        res.status(200).json({ message: 'Leaderboard fetched successfully', leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'An error occurred while fetching the leaderboard.' });
    }
};





export {
    createContest,
    getOngoingContest,
    createContestReel,
    getContestLeaderboard
}