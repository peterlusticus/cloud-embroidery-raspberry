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
    fetch(url)
      .then(response => console.log(response.text()))
  }).catch(err => {
    console.log('The download failed: ' + err);
  })

  onValue(databaseRef(db, 'processes/09c6a338-e763-4d7d-8aca-dcbb48e9ad3b/Speed'), (snapshot) => {
    getDownloadURL(ref).then(url => {
      fetch(url)
        .then(response => response.text())
        .then(gcode => {
          const lines = gcode.split('\n')
          var x_before = 0;
          var y_before = 0;
          lines.forEach(line => {
            if(line.includes('X') && line.includes('Y')){
              const x = line.slice(line.indexOf('X') + 1, line.indexOf('Y') - 2).replace('.','')
              const y = line.slice(line.indexOf('Y') + 1, line.length).replace('.','')
              const x_steps = x_before - x
              const y_steps = y_before - y
              x_before = x
              y_before = y
              console.log(x_steps, y_steps)
              //jog(1, x_steps)
            }
            if(line.includes('M')){

            }
            if(line.includes('COLOR')){

            }
          });
        })
    }).catch(err => {
      console.log('The download failed: ' + err);
    })

    led.blink(snapshot.val());
    console.log(snapshot.val());
  }, (err) => {
    console.log('The read failed: ' + err.name);
  })
})




