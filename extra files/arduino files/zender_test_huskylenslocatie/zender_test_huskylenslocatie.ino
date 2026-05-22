#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>

// =======================
// Instellingen
// =======================
#define ZENDER_ID 1
#define WIFI_CHANNEL 1
uint8_t RECEIVER_MAC[] = { 0xA4, 0xF0, 0x0F, 0x8E, 0x67, 0x9C };

// Dummy sensoren
struct Sensor {
  const char* naam;
  const char* waarde;
};

//==================
//sensoren definiëren
//==================
Sensor sensoren[] = {  //hier alle sensor namen toevoegen in type: {"naam van sensor", "0"}. dit zijn eigenlijk de namen van de variabele
  { "ax1", "0" },
  { "huskylensLocatie", "0001.02.01.M11" },
};
const int AANTAL_SENSOREN = sizeof(sensoren) / sizeof(sensoren[0]);

char ax1Waarde[16];
int huskylensLocatie = 1;

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
// Loop, hier mag je alles inzetten van de waardes
// =======================

void loop() {

  //                  |-dit vervangen-|
  sprintf(ax1Waarde, "%d", random(0, 100));  //vul de variabele in met de echt sensorwaardes(vervang de random waardes)
  sensoren[0].waarde = ax1Waarde;

  if (huskylensLocatie == 1) {
    sensoren[1].waarde = "0001.02.01.M11";
    huskylensLocatie = 2;
  } else {
    sensoren[1].waarde = "0001.02.02.M11";
    huskylensLocatie = 1;
  }

  for (int i = 0; i < AANTAL_SENSOREN; i++) {
    sendSensor(sensoren[i].naam, sensoren[i].waarde);
    delay(200);
  }

  delay(3000);
}

// =======================
// Functie om sensor te verzenden HIER AF BLIJVEN
// =======================
void sendSensor(const char* sensorNaam, const char* waarde) {
  StaticJsonDocument<128> doc;

  doc["id"] = ZENDER_ID;
  doc["type"] = sensorNaam;
  doc["waarde"] = waarde;

  char payload[128];
  size_t n = serializeJson(doc, payload, sizeof(payload));
  esp_now_send(RECEIVER_MAC, (uint8_t*)payload, n);

  Serial.println(payload);
}