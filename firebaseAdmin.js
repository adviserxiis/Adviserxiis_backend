// firebaseAdmin.js
import admin from 'firebase-admin';
import { createRequire } from 'module';
// import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };


const require = createRequire(import.meta.url);
// const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://adviserxiis-920e5-default-rtdb.firebaseio.com"
  });

const database = admin.database();
export { admin, database };
