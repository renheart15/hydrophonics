#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials
const char* ssid = "GlobeAtHome_26B77_2.4"; // Replace with your WiFi SSID
const char* password = "2258A607"; // Replace with your WiFi password

// Server URL for deployed app
const char* serverUrl = "https://hydrophonics-mu.vercel.app";

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
unsigned long lastSensorSend = 0;
unsigned long lastPumpCheck = 0;

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
}

void loop() {
  // Send sensor data to server every 3 seconds
  if (millis() - lastSensorSend > 3000) {
    sendSensorData();
    lastSensorSend = millis();
  }

  // Check pump status from server every 1 second
  if (millis() - lastPumpCheck > 1000) {
    checkPumpStatus();
    lastPumpCheck = millis();
  }
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

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(serverUrl) + "/api/sensor");
  http.addHeader("Content-Type", "application/json");

  float ph = readPH();
  float waterLevel = readWaterLevel();

  String jsonData = "{";
  jsonData += "\"ph\":" + String(ph, 2) + ",";
  jsonData += "\"water_level\":" + String(waterLevel, 0) + ",";
  jsonData += "\"pump_status\":" + String(pumpStatus ? "true" : "false");
  jsonData += "}";

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.println("Sensor data sent successfully");
  } else {
    Serial.println("Error sending sensor data: " + String(httpResponseCode));
  }

  http.end();
}

void checkPumpStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(serverUrl) + "/api/pump");

  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    String payload = http.getString();
    // Simple JSON parsing
    bool newStatus = payload.indexOf("true") != -1;
    if (newStatus != pumpStatus) {
      pumpStatus = newStatus;
      digitalWrite(PUMP_RELAY_PIN, pumpStatus ? HIGH : LOW);
      Serial.println("Pump status updated to: " + String(pumpStatus ? "ON" : "OFF"));
    }
  } else {
    Serial.println("Error checking pump status: " + String(httpResponseCode));
  }

  http.end();
}
