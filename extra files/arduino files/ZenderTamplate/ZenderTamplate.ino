#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>

// =======================
// Instellingen
// =======================
#define ZENDER_ID 1
#define WIFI_CHANNEL 1
uint8_t RECEIVER_MAC[] = { 0x40, 0x22, 0xDF, 0xFF, 0x7D, 0xF8 };

// Dummy sensoren
struct Sensor {
  const char* naam;
  float waarde;
};
Sensor sensoren[] = {
  { "ax1", 0 },
  { "ay1", 0 },
  { "az1", 0 },
};  //hier alle sensor namen toevoegen in type: {"naam van sensor", 0}. dit zijn eigenlijk de namen van de variabele
const int AANTAL_SENSOREN = sizeof(sensoren) / sizeof(sensoren[0]);



// =======================
// Setup HIER NIKS AANPASSEN. je mag dingen toevoegen als je weet wat je doet
// =======================
void setup() {
  Serial.begin(9600);
  WiFi.mode(WIFI_STA);
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    while (true)
      ;
  }

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, RECEIVER_MAC, 6);
  peer.channel = WIFI_CHANNEL;
  peer.encrypt = false;
  esp_now_add_peer(&peer);

  Serial.println("ESP-NOW Sender ready");
}


// =======================
// Functie om sensor te verzenden HIER AF BLIJVEN
// =======================
void sendSensor(const char* sensorNaam, float waarde) {
  StaticJsonDocument<128> doc;

  doc["id"] = ZENDER_ID;
  doc["type"] = sensorNaam;
  doc["waarde"] = waarde;

  char payload[128];
  size_t n = serializeJson(doc, payload, sizeof(payload));
  esp_now_send(RECEIVER_MAC, (uint8_t*)payload, n);

  Serial.println(payload);
}

// =======================
// Loop, hier mag je alles inzetten van de waardes
// =======================

void loop() {  //      |--dit vervangen--|
  // Locatie variabelen
  sensoren[0].waarde = a1.acceleration.x;  //vul de variabele in met de sensorwaardes(voeg zoveel toe als aantal sensortypes)
  sensoren[1].waarde = a1.acceleration.y;
  sensoren[2].waarde = a1.acceleration.z;

  for (int i = 0; i < AANTAL_SENSOREN; i++) {
    sendSensor(sensoren[i].naam, sensoren[i].waarde);
    delay(200);
  }

  delay(3000);
}