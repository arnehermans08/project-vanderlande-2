#include <WiFi.h>
#include <esp_now.h>

#define WIFI_CHANNEL 1
#define MSG_POOL_SIZE 8
#define MSG_MAX_LEN 256

struct MsgSlot {
  bool used;
  uint8_t data[MSG_MAX_LEN];
  uint8_t len;
};

static MsgSlot msgPool[MSG_POOL_SIZE];
static QueueHandle_t msgQueue;

// -----------------------------
// Callback: ontvangen ESP-NOW data
// -----------------------------
void onReceive(const esp_now_recv_info_t *info, const uint8_t *incomingData, int len) {
  if (len <= 0 || len > MSG_MAX_LEN) return;

  int idx = -1;
  noInterrupts();
  for (int i = 0; i < MSG_POOL_SIZE; i++) {
    if (!msgPool[i].used) { idx = i; msgPool[i].used = true; break; }
  }
  interrupts();

  if (idx < 0) return;

  msgPool[idx].len = len;
  memcpy(msgPool[idx].data, incomingData, len);

  xQueueSendFromISR(msgQueue, &idx, NULL);
}

// -----------------------------
// Verwerk en stuur alles door naar Pi
// -----------------------------
void processMessage(MsgSlot *m) {
  Serial.write(m->data, m->len);
  Serial.println();
}

// -----------------------------
// Setup & loop
// -----------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  WiFi.mode(WIFI_STA);


  if (esp_now_init() != ESP_OK) while(true);

  for (int i = 0; i < MSG_POOL_SIZE; i++) msgPool[i].used = false;
  msgQueue = xQueueCreate(MSG_POOL_SIZE, sizeof(uint8_t));
  esp_now_register_recv_cb(onReceive);

  Serial.println("ESP-NOW Receiver ready");
}

void loop() {
  uint8_t idx;
  while (xQueueReceive(msgQueue, &idx, 0) == pdTRUE) {
    if (idx >= MSG_POOL_SIZE) continue;
    processMessage(&msgPool[idx]);
    noInterrupts();
    msgPool[idx].used = false;
    interrupts();
  }
  delay(10);
}