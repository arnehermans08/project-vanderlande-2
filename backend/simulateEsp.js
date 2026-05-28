#!/usr/bin/env node
console.log("🎮 ESP Simulator gestart");
console.log("📡 Simuleert ESP32 sensoren en stuurt data naar API-BE");

let axios = require('axios');

// ===== CONFIGURATIE =====
let API_URL = 'http://localhost:8080/data';  // API-BE endpoint
let INTERVAL_MS = 3000;  // Elke 3 seconden een update

// ===== DEFINITIES VAN ALLE SENSOREN PER ESP =====
let ESP_CONFIG = {
  1: {  // ESP1 - Tof10120 (afstand)
    name: "TofAfstand",
    sensors: [
      { type: "TofAfstand1", min: 5, max: 100 },
      { type: "TofAfstand2", min: 5, max: 100 }
    ]
  },
  2: {  // ESP2 - Amg8831 (temperatuur)
    name: "Temperatuur",
    sensors: [
      { type: "centerTemp", min: 15, max: 85 }
    ]
  },
  3: {  // ESP3 - MPU6050 (accelerometer/gyroscoop)
    name: "Accelerometer",
    sensors: [
      { type: "ax1", min: 0, max: 100 },
      { type: "ay1", min: 0, max: 100 },
      { type: "az1", min: 0, max: 100 },
      { type: "gx1", min: 0, max: 100 },
      { type: "gy1", min: 0, max: 100 },
      { type: "gz1", min: 0, max: 100 },
      { type: "ax2", min: 0, max: 100 },
      { type: "ay2", min: 0, max: 100 },
      { type: "az2", min: 0, max: 100 },
      { type: "gx2", min: 0, max: 100 },
      { type: "gy2", min: 0, max: 100 },
      { type: "gz2", min: 0, max: 100 }
    ]
  },
  4: {  // ESP4 - RFID RC522 (locatie)
    name: "RFID",
    sensors: [
      { type: "nfcLocatie", min: 1, max: 2, isLocation: true }
    ]
  },
  5: {  // ESP5 - Huskylens (camera locatie)
    name: "Huskylens",
    sensors: [
      { type: "huskylensLocatie", format: "huskylens", isLocation: true }
    ]
  },
  6: {  // ESP6 - Infrarood temp 1
    name: "Infrarood1",
    sensors: [
      { type: "temperatuur1", min: 15, max: 85 }
    ]
  },
  7: {  // ESP7 - Infrarood temp 2
    name: "Infrarood2",
    sensors: [
      { type: "temperatuur2", min: 15, max: 85 }
    ]
  }
};

// ===== HULPFUNCTIES =====
function randomValue(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(4));
}

function generateHuskylensValue(segment) {
  return segment.toString().padStart(4, '0');
}

// ===== SIMULATIE LOOP =====
async function sendSensorData(espId, sensorConfig) {
  for (let sensor of sensorConfig.sensors) {
    let waarde;
    
    if (sensor.type === "huskylensLocatie") {
      let cycleTime = Math.floor(Date.now() / 5000) % 2 + 1;
      waarde = generateHuskylensValue(cycleTime);
    } else if (sensor.isLocation) {
      let cycleTime = Math.floor(Date.now() / 3000) % 2 + 1;
      waarde = cycleTime;
    } else {
      waarde = randomValue(sensor.min, sensor.max);
    }
    
    let data = {
      id: espId,
      type: sensor.type,
      waarde: waarde
    };
    
    try {
      await axios.post(API_URL, data);
      let displayWaarde = waarde;
      if (sensor.type === "huskylensLocatie") {
        displayWaarde = `"${waarde}"`;
      }
      console.log(`✅ ESP${espId} → ${sensor.type}: ${displayWaarde}`);
    } catch (err) {
      console.log(`❌ ESP${espId} → ${sensor.type}: FOUT - ${err.message}`);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
}

async function simulateAllESPs() {
  console.log("\n🔄 " + new Date().toLocaleTimeString() + " - Start simulatie ronde\n");
  
  for (let [espId, config] of Object.entries(ESP_CONFIG)) {
    await sendSensorData(parseInt(espId), config);
  }
  
  console.log("\n✅ Ronde compleet, wacht op volgende ronde...\n");
}

// ===== MENU / COMMAND LINE INTERFACE =====
function showMenu() {
  console.log(`
╔══════════════════════════════════════════════════╗
║              ESP SIMULATOR MENU                  ║
╠══════════════════════════════════════════════════╣
║  1. Start continue simulatie (alle ESPs)         ║
║  2. Stuur 1 ronde (alle ESPs eenmalig)           ║
║  3. Stuur specifieke ESP (kies nummer)           ║
║  4. Stuur specifieke locatie (direct naar segment)║
║  5. Stop simulatie                               ║
║  6. Toon ESP configuratie overzicht              ║
║  0. Exit                                         ║
╚══════════════════════════════════════════════════╝
  `);
}

async function sendSingleESP() {
  let readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Welke ESP (1-7): ', async (answer) => {
    let espId = parseInt(answer);
    if (ESP_CONFIG[espId]) {
      console.log(`\n📡 Stuur data van ESP${espId}...`);
      await sendSensorData(espId, ESP_CONFIG[espId]);
      console.log(`✅ ESP${espId} data verzonden\n`);
    } else {
      console.log(`❌ ESP${espId} bestaat niet!\n`);
    }
    readline.close();
    startCLI();
  });
}

async function sendDirectLocation() {
  let readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Welk segment (1-2): ', async (answer) => {
    let segment = parseInt(answer);
    if (segment >= 1 && segment <= 2) {
      let huskylensValue = generateHuskylensValue(segment);
      let data = { id: 5, type: "huskylensLocatie", waarde: huskylensValue };
      await axios.post(API_URL, data);
      console.log(`✅ Locatie gestuurd: Huskylens → segment ${segment} ("${huskylensValue}")`);
      
      let nfcData = { id: 4, type: "nfcLocatie", waarde: segment };
      await axios.post(API_URL, nfcData);
      console.log(`✅ Locatie gestuurd: NFC → segment ${segment}`);
    } else {
      console.log(`❌ Segment ${segment} bestaat niet! Gebruik 1 of 2`);
    }
    readline.close();
    startCLI();
  });
}

function showConfig() {
  console.log("\n📋 ESP Configuratie Overzicht:\n");
  for (let [espId, config] of Object.entries(ESP_CONFIG)) {
    console.log(`ESP${espId} - ${config.name}:`);
    for (let sensor of config.sensors) {
      console.log(`   └─ ${sensor.type}`);
    }
    console.log();
  }
}

let intervalId = null;

function startContinuousSimulation() {
  if (intervalId) {
    console.log("⚠️ Simulatie draait al!");
    return;
  }
  console.log("▶️ Start continue simulatie (elke 3 seconden)...");
  simulateAllESPs();
  intervalId = setInterval(simulateAllESPs, INTERVAL_MS);
}

function stopSimulation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("⏹️ Simulatie gestopt");
  } else {
    console.log("ℹ️ Geen actieve simulatie");
  }
}

async function startCLI() {
  let readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  showMenu();
  
  readline.question('Kies een optie: ', async (choice) => {
    switch(choice) {
      case '1':
        startContinuousSimulation();
        break;
      case '2':
        await simulateAllESPs();
        break;
      case '3':
        readline.close();
        await sendSingleESP();
        return;
      case '4':
        readline.close();
        await sendDirectLocation();
        return;
      case '5':
        stopSimulation();
        break;
      case '6':
        showConfig();
        break;
      case '0':
        console.log("👋 Simulatie gestopt. Tot ziens!");
        if (intervalId) clearInterval(intervalId);
        process.exit(0);
      default:
        console.log("❌ Ongeldige keuze, probeer opnieuw");
    }
    readline.close();
    startCLI();
  });
}

// ===== START =====
console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║     🎮 ESP SIMULATOR - Vanderlande Project       ║
║                                                  ║
║     Simuleert alle 7 ESPs met hun sensoren       ║
║     Locatie: 2 segmenten (1 en 2)               ║
║     Huskylens formaat: "0001" of "0002"          ║
║     Stuurt data naar: ${API_URL}               ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`);

startCLI();