// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkV2RaH7IMbXr2k6zSmfWd4IVPayRq1X8",
  authDomain: "adviserxiis-920e5.firebaseapp.com",
  projectId: "adviserxiis-920e5",
  storageBucket: "adviserxiis-920e5.appspot.com",
  messagingSenderId: "553796556466",
  appId: "1:553796556466:web:d4b07e85f8786b0d081bab",
  measurementId: "G-HD3PSKGEH8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
