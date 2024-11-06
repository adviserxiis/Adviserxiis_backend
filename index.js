import express from 'express'
import cors from 'cors'
import { sendEnquiryMail, sendMail } from './Controllers/SendMail.js';
import { sendConfirmationMail } from './Controllers/SendConfirmationMail.js';
import timeout from 'connect-timeout'; 
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import { sendChangePasswordOtp } from './Controllers/ChangePasswordOtp.js';
import adviserRoutes from './Routes/AdviserRoutes.js'
import userRoutes from './Routes/UserRoutes.js'
import postRoutes from './Routes/PostRoutes.js'
import testRoutes from './Routes/TestRoutes.js'
import creatorRoutes from './Routes/CreatorRoutes.js'
import notificationRoutes from './Routes/NotificationRoutes.js'
import contestRoutes from './Routes/ContestRoutes.js'
import serviceRoutes from './Routes/ServiceRoutes.js'

const PORT = process.env.PORT || 8000


const app = express()

app.use(cors());
app.use(express.json());
app.use(timeout('300s'));
// app.use(express.urlencoded({extended: false}));
// app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


dotenv.config()

app.get('/', (req,res) => {
    res.send("Hello world")
})


  app.post("/order", async (req, res) => {

    
try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZERPAY_KEY_ID,
            key_secret: process.env.RAZERPAY_SECRET,
        });
    
        const options = req.body;
    
        const order = await razorpay.orders.create(options);
    
        if(!order){
            return res.status(500).send("Error");
        }
    
        res.json(order);
} catch (error) {
    res.status(500).send("error")
    console.log("Error", error)
}
  })


  app.post("/order/validate", async(req, res) =>{
       
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature} = req.body

    const sha = crypto.createHmac("sha256",process.env.RAZERPAY_SECRET);
    // order_id + "|" + razorpay_payment_id
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);

    const digest = sha.digest("hex");
    if(digest !== razorpay_signature)
        {
            res.status(400).json({msg:"Transaction is not legit!"});
        }

        res.status(200).json({
            msg:"success",
            orderId:razorpay_order_id,
            paymentId:razorpay_payment_id
        })
  })

app.get('/sendemail/:userId', sendMail)

app.post('/sendenquirymail', sendEnquiryMail)

app.get('/changepassword/:userId', sendChangePasswordOtp)

app.post('/sendconfirmationemail', sendConfirmationMail)


app.use('/adviser', adviserRoutes)

app.use('/user',userRoutes)

app.use('/post',postRoutes)

app.use('/creator',creatorRoutes)

app.use('/test',testRoutes)

app.use('/notification',notificationRoutes)

app.use('/contest',contestRoutes)

app.use('/service',serviceRoutes)


app.listen(PORT, () =>{
    console.log(`Server is running at ${PORT}`)
})



