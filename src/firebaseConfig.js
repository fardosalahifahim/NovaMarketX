// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjV2cxQt96NBZuN7VpYzQ61Vl2CHpOO4Q",
  authDomain: "anime-sprig.firebaseapp.com",
  projectId: "anime-sprig",
  storageBucket: "anime-sprig.firebasestorage.app",
  messagingSenderId: "349853958324",
  appId: "1:349853958324:web:b917efb1d5a2af736617e1",
  measurementId: "G-RGT6YF60BB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
