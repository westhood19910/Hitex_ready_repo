
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYc2mAE_Rrhkui5KhmSGm4WCisVvJsozg",
  authDomain: "hitex-editex-id.firebaseapp.com",
  projectId: "hitex-editex-id",
  storageBucket: "hitex-editex-id.firebasestorage.app",
  messagingSenderId: "976692089100",
  appId: "1:976692089100:web:524e67931fd15cc2f77929",
  measurementId: "G-WBBP7J7201"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { app, db, auth };
