const { initializeApp } = require('firebase/app');
const { getDatabase, ref: databaseRef, onValue } = require('firebase/database');
const { getStorage, ref: storageRef, getDownloadURL, getBytes, getBlob, getStream } = require('firebase/storage');
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

  const ref = storageRef(storage, 'files/09c6a338-e763-4d7d-8aca-dcbb48e9ad3b/gcode.txt')
  getDownloadURL(ref).then(url => {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.onload = function (event) {
      var gcode = xhr.response;
      console.log(gcode);      // now you read the file content
      
    };
    xhr.open('GET', url);
    xhr.send();
  }).catch(err => {
    console.log('The download failed: ' + err);
  })

  onValue(databaseRef(db, 'processes/09c6a338-e763-4d7d-8aca-dcbb48e9ad3b/Speed'), (snapshot) => {
    getDownloadURL(storageRef(storage, 'files/09c6a338-e763-4d7d-8aca-dcbb48e9ad3b/gcode.txt'), (url) => {
      console.log(url);
    })
    led.blink(snapshot.val());
    console.log(snapshot.val());
  }, (err) => {
    console.log('The read failed: ' + err.name);
  })
})




