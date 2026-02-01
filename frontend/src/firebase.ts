import { initializeApp } from "firebase/app";
import {
    GoogleAuthProvider,
    GithubAuthProvider,
    getAuth,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ConvoSense-e916b Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBw1THg38vpjeDu-T4uhzWJa35ZpMVt5hw",
    authDomain: "convosense-e916b.firebaseapp.com",
    projectId: "convosense-e916b",
    storageBucket: "convosense-e916b.firebasestorage.app",
    messagingSenderId: "1091463725345",
    appId: "1:1091463725345:web:2efeabd2c8ea8e14ca3e60",
    measurementId: "G-3ZGJYCG9T9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
    try {
        const res = await signInWithPopup(auth, googleProvider);
        return res.user;
    } catch (err: any) {
        console.error(err);
        alert(err.message);
    }
};

const githubProvider = new GithubAuthProvider();
const signInWithGithub = async () => {
    try {
        const res = await signInWithPopup(auth, githubProvider);
        return res.user;
    } catch (err: any) {
        console.error(err);
        alert(err.message);
    }
};

const logout = () => {
    signOut(auth);
};

export { app, auth, db, signInWithGoogle, signInWithGithub, logout };
