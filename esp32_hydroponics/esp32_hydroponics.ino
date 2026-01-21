#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>

// WiFi credentials
const char* ssid = "GlobeAtHome_26B77_2.4"; // Replace with your WiFi SSID
const char* password = "2258A607"; // Replace with your WiFi password

// Pin definitions
#define PH_PIN 34
#define TRIG_PIN 12
#define ECHO_PIN 13
#define PUMP_RELAY_PIN 14

// Constants
#define VREF 3.3
#define ADC_RESOLUTION 4095.0
#define SOUND_SPEED 0.034 // cm/us
#define TANK_HEIGHT 965 // mm

// pH calibration (from your formula)
float voltage1 = 1.096; // Voltage at pH 6.86
float pH1 = 6.86;
float voltage2 = 0.884; // Voltage at pH 4.01
float pH2 = 4.01;
float slope;
float intercept;

// Variables
bool pumpStatus = false;
WebServer server(8080);

void setup() {
  Serial.begin(115200);

  // Calculate pH calibration
  slope = (pH2 - pH1) / (voltage2 - voltage1);
  intercept = pH1 - slope * voltage1;

  // Pin modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, LOW); // Pump off initially

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected to WiFi. IP: ");
  Serial.println(WiFi.localIP());

  // Setup mDNS
  if (MDNS.begin("esp32-hydroponics")) {
    Serial.println("mDNS responder started");
    MDNS.addService("_http", "_tcp", 8080);
  } else {
    Serial.println("Error setting up mDNS responder!");
  }

  // Setup server routes
  server.on("/sensor", HTTP_GET, handleSensor);
  server.on("/sensor", HTTP_OPTIONS, handleOptions);
  server.on("/pump", HTTP_POST, handlePump);
  server.on("/pump", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}

void handleSensor() {
  float ph = readPH();
  float waterLevel = readWaterLevel();
  bool pump = pumpStatus;

  String json = "{";
  json += "\"ph\":" + String(ph, 2) + ",";
  json += "\"water_level\":" + String(waterLevel, 0) + ",";
  json += "\"pump_status\":" + String(pump ? "true" : "false");
  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "application/json", json);
}

void handlePump() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    // Simple JSON parsing (assuming {"pump_status":true/false})
    bool newStatus = body.indexOf("true") != -1;
    pumpStatus = newStatus;
    digitalWrite(PUMP_RELAY_PIN, newStatus ? HIGH : LOW);
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else {
    server.send(400, "application/json", "{\"error\":\"Invalid request\"}");
  }
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "text/plain", "");
}

float readPH() {
  int adcValue = analogRead(PH_PIN);
  float voltage = adcValue * (VREF / ADC_RESOLUTION);
  float phValue = slope * voltage + intercept;
  return phValue;
}

float readWaterLevel() {
  // Trigger ultrasonic sensor
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distanceCm = duration * SOUND_SPEED / 2;
  float distanceMm = distanceCm * 10;

  // Water level = tank height - distance to water surface
  float waterLevel = TANK_HEIGHT - distanceMm;

  // Clamp to valid range
  if (waterLevel < 0) waterLevel = 0;
  if (waterLevel > TANK_HEIGHT) waterLevel = TANK_HEIGHT;

  return waterLevel;
}
