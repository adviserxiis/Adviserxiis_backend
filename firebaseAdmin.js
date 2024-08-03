// firebaseAdmin.js
import admin from 'firebase-admin';
import { createRequire } from 'module';
// import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };
import dotenv from 'dotenv';

dotenv.config();

console.log("env",process.env)
const require = createRequire(import.meta.url);
// const admin = require('firebase-admin');
// const serviceAccount = require("./serviceAccountKey.json");

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://adviserxiis-920e5-default-rtdb.firebaseio.com",
    storageBucket: "adviserxiis-920e5.appspot.com"
  });

const database = admin.database();
const storage = admin.storage().bucket();

export { admin, database, storage };
