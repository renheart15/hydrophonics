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
  // Take multiple readings and average for better accuracy
  const int numReadings = 10;
  float sum = 0;
  
  for (int i = 0; i < numReadings; i++) {
    int adcValue = analogRead(PH_PIN);
    float voltage = adcValue * (VREF / ADC_RESOLUTION);
    sum += voltage;
    delay(10); // Small delay between readings
  }
  
  float avgVoltage = sum / numReadings;
  float phValue = slope * avgVoltage + intercept;
  
  // Clamp to reasonable pH range
  if (phValue < 0) phValue = 0;
  if (phValue > 14) phValue = 14;
  
  return phValue;
}

float readWaterLevel() {
  // Take multiple readings and use median for better accuracy
  const int numReadings = 5;
  float readings[numReadings];
  
  for (int i = 0; i < numReadings; i++) {
    // Trigger ultrasonic sensor
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // Read echo with timeout
    long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (about 5m range)
    
    if (duration == 0) {
      // No echo received, invalid reading
      readings[i] = -1;
    } else {
      float distanceCm = duration * SOUND_SPEED / 2;
      float distanceMm = distanceCm * 10;
      readings[i] = distanceMm;
    }
    
    delay(50); // Wait before next reading
  }
  
  // Sort readings to find median (ignore invalid readings)
  int validCount = 0;
  float validReadings[numReadings];
  for (int i = 0; i < numReadings; i++) {
    if (readings[i] > 0) {
      validReadings[validCount++] = readings[i];
    }
  }
  
  if (validCount == 0) return 0; // No valid readings
  
  // Simple sort for median
  for (int i = 0; i < validCount - 1; i++) {
    for (int j = i + 1; j < validCount; j++) {
      if (validReadings[i] > validReadings[j]) {
        float temp = validReadings[i];
        validReadings[i] = validReadings[j];
        validReadings[j] = temp;
      }
    }
  }
  
  float medianDistance = validReadings[validCount / 2];
  
  // Water level = tank height - distance to water surface
  float waterLevel = TANK_HEIGHT - medianDistance;

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
