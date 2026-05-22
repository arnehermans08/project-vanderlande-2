#include <WiFi.h>
#include "esp_wifi.h"

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin();
  delay(500);
  
  Serial.print("MAC: ");
  Serial.println(WiFi.macAddress());

  uint8_t mac[6];
  esp_wifi_get_mac(WIFI_IF_STA, mac);
  Serial.printf("MAC via esp_wifi: %02X:%02X:%02X:%02X:%02X:%02X\n",
    mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

void loop() {}