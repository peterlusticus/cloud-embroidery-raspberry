const { initializeApp } = require('firebase/app');
const { getDatabase, ref: databaseRef, onValue } = require('firebase/database');
const { getStorage, ref: storageRef } = require('firebase/storage');
const { Board, Led } = require("johnny-five");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAn_EqhijL1eXiZd_9Gp84tJub091O36CA",
    authDomain: "stickmaschine-datenbank.firebaseapp.com",
    databaseURL: "https://stickmaschine-datenbank-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "stickmaschine-datenbank",
    storageBucket: "stickmaschine-datenbank.appspot.com",
    messagingSenderId: "355392625068",
    appId: "1:355392625068:web:a9572073bac4027e944209",
    measurementId: "G-F7H8CVNG3K"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

// Get storage
const storage = getStorage();

// Get a database reference to our posts
const db = getDatabase();

// get arduino
const board = new Board();


board.on("ready", () => {
    const led = new Led(13);

    onValue(databaseRef(db, 'processes/7d2ef116-cbe9-44ca-bd97-f0db4967e179/State'), (snapshot) => {
        led.blink(snapshot.val()*10);
        console.log(snapshot.val());
    }, (errorObject) => {
        console.log('The read failed: ' + errorObject.name);
    });
});




