const { initializeApp } = require('firebase/app');
const { getDatabase, ref: databaseRef, onValue } = require('firebase/database');
const { getStorage, ref: storageRef, getDownloadURL } = require('firebase/storage');
const { Board, Sensor, Stepper } = require("johnny-five");

// Firebase Konfiguration
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

// Arduino initialisieren
const board = new Board();

board.on("ready", () => {

  // --- Motor Pin ---
  const motorPin = 5; // Definiere den Pin für den Motor (PWM-fähig)
  board.pinMode(motorPin, board.MODES.PWM);

  // Schrittmotoren initialisieren
  const stepperX = new Stepper({
    type: Stepper.TYPE.DRIVER,
    stepsPerRev: 200, // Schritte pro Umdrehung (Anpassen!)
    pins: {
      step: 12, // Pin für Schritt X
      dir: 11  // Pin für Richtung X
    }
  });

  const stepperY = new Stepper({
    type: Stepper.TYPE.DRIVER,
    stepsPerRev: 200, // Schritte pro Umdrehung (Anpassen!)
    pins: {
      step: 8,  // Pin für Schritt Y
      dir: 9   // Pin für Richtung Y
    }
  });

  // Rotationssensor initialisieren
  const rotarySensor = new Sensor({
    pin: "A0", // Ersetze A0 durch den tatsächlichen Pin des Rotationssensors
    freq: 250, // Optional: Abtastrate des Sensors anpassen
  });

  // Variablen für die Schritt-Steuerung
  let currentLine = 0;
  let stepsPerRevolution = 200; // Schritte pro Umdrehung des Sensors (Anpassen!)
  let currentSteps = 0;

  let lines = []; // Array zum Speichern der Koordinatenzeilen

  // ---  Delay aus Firebase lesen ---
  const delayRef = databaseRef(db, 'processes/09c6a338-e763-4d7d-8aca-dcbb48e9ad3b/Delay');
  let delayValue = 0; // Initialwert für die Verzögerung

  onValue(delayRef, (snapshot) => {
    delayValue = snapshot.val();
    console.log("Delay Wert aus Firebase:", delayValue);
  }, (err) => {
    console.log('Fehler beim Lesen des Delay-Werts: ' + err.name);
  });

  // ---  G-Code aus Firebase lesen und in "lines" speichern ---
  const ref = storageRef(storage, 'files/09c6a338-e763-4d7d-8aca-dcbb48e9ad3b/gcode.txt');
  getDownloadURL(ref).then(url => {
    fetch(url)
      .then(response => response.text())
      .then(gcode => {
        console.log("G-Code aus Firebase:", gcode);
        lines = gcode.split('\n').filter(line => line.includes('X') && line.includes('Y'));
      }).catch(err => {
        console.log('Fehler beim Lesen der G-Code Datei: ' + err);
      });
  }).catch(err => {
    console.log('Download fehlgeschlagen: ' + err);
  });

  // --- Eventlistener für den Rotationssensor ---
  rotarySensor.on("change", function () {
    currentSteps++;
    if (currentSteps >= stepsPerRevolution) {
      currentSteps = 0;
      processLine();
    }
  });

  // --- Funktion zum Verarbeiten einer Zeile ---
  function processLine() {
    if (currentLine < lines.length) {
      const line = lines[currentLine];
      console.log("Aktuelle Zeile:", line);
      console.log("X: " + line.slice(line.indexOf('X') + 1, line.indexOf('Y') - 1).replace('.', ''));
      console.log("Y: " + line.slice(line.indexOf('Y') + 1, line.length).replace('.', ''));

      const x = parseFloat(line.slice(line.indexOf('X') + 1, line.indexOf('Y') - 1).replace('.', ''));
      const y = parseFloat(line.slice(line.indexOf('Y') + 1, line.length).replace('.', ''));

      // Schrittmotoren ansteuern
      moveStepper(stepperX, x);
      moveStepper(stepperY, y);

      console.log("Verarbeite Zeile:", line);
      currentLine++;
    } else {
      console.log("Alle Zeilen verarbeitet.");
    }
  }

  // --- Funktion zum Ansteuern eines Schrittmotors ---
  function moveStepper(stepper, steps) {
    const direction = steps > 0 ? Stepper.DIRECTION.CW : Stepper.DIRECTION.CCW;
    stepper.step({
      steps: Math.abs(steps),
      direction: direction
    }, () => {
      console.log("Stepper done moving");
    });
  }

  // ---  Motorgeschwindigkeit aus Firebase lesen und anpassen ---
  const speedRef = databaseRef(db, 'processes/09c6a338-e763-4d7d-8aca-dcbb48e9ad3b/Speed');

  onValue(speedRef, (snapshot) => {
    let speedValue = snapshot.val();
    console.log("Geschwindigkeitswert aus Firebase:", speedValue);

    // Wert von 0-100 auf 0-255 anpassen
    const analogValue = Math.floor(speedValue * 2.55);

    // Motorgeschwindigkeit setzen
    board.analogWrite(motorPin, analogValue);
  }, (err) => {
    console.log('Fehler beim Lesen des Geschwindigkeitswerts: ' + err.name);
  });

});