import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTKJIx8AtUHWek5lWTGvxlHDkujsauVOo",
  authDomain: "kobag2-school-suite.firebaseapp.com",
  projectId: "kobag2-school-suite",
  storageBucket: "kobag2-school-suite.firebasestorage.app",
  messagingSenderId: "460622784255",
  appId: "1:460622784255:web:6bb30e26548908baeb0eca",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);