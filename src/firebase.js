// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLEkVWr4m7jJKf7wdSPMqluxSQ-2AmjDQ",
  authDomain: "luke-tablegame-helper.firebaseapp.com",
  databaseURL: "https://luke-tablegame-helper-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "luke-tablegame-helper",
  storageBucket: "luke-tablegame-helper.firebasestorage.app",
  messagingSenderId: "685546021217",
  appId: "1:685546021217:web:0e5a6e43f377ff7e672520"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

export { database };