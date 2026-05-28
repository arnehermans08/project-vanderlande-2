console.log("🚀 SerialHandler gestart");
console.log("📡 Wachten op data van ESP...");

let { SerialPort } = require('serialport');
let { ReadlineParser } = require('@serialport/parser-readline');
let axios = require('axios');

// Maak verbinding met de ESP32 via USB
// path: de COM-poort waarop de ESP aangesloten is
// baudRate: moet overeenkomen met Serial.begin() in de Arduino code
let poort = new SerialPort({
  path: 'COM8',
  baudRate: 115200
});

// Splits de binnenkomende data op per regel (\n)
// Elke nieuwe regel = 1 JSON bericht van de ESP
let parser = poort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Wordt uitgevoerd elke keer er een nieuwe regel binnenkomt
parser.on('data', async (regel) => {
  let data = regel.trim(); // verwijder spaties en enters rondom de tekst
  if (data) {
    console.log("📥 Van ESP:", data);

    // Probeer de tekst om te zetten naar een JavaScript object
    // Als de JSON ongeldig is (bv. incomplete zin), sla dan over
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      console.log("⚠️ Ongeldige JSON, overgeslagen:", data);
      return;
    }

    // Probeer de waarde om te zetten naar een getal
    // Als het geen getal is (bv. "0001.02.01.M11"), blijft het een string
    let alsGetal = Number(parsed.waarde);
    if (!isNaN(alsGetal)) parsed.waarde = alsGetal;

    // Stuur het object door naar de API-BE die het opslaat in de database
    try {
      await axios.post('http://localhost:8080/data', parsed);
      console.log("✅ Doorgestuurd naar API-BE");
    } catch (fout) {
      console.log("❌ Fout bij doorsturen:", fout.message);
    }
  }
});

// Bevestiging dat de USB poort succesvol geopend is
poort.on('open', () => {
  console.log("✅ USB poort geopend!");
});

// Foutmelding als de USB poort niet geopend kan worden
// (bv. verkeerde COM-poort of ESP niet aangesloten)
poort.on('error', (fout) => {
  console.log("❌ USB poort fout:", fout.message);
});