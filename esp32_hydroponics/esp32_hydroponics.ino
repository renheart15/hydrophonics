#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials
const char* ssid = "GlobeAtHome_26B77_2.4";
const char* password = "2258A607";

// Server URLs
const char* emailServerUrl = "https://hydrophonics-mu.vercel.app/api/sendEmail";
const char* sensorServerUrl = "https://hydrophonics-mu.vercel.app/api/sensor";

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

// pH calibration
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

// Alert tracking variables
bool phLowAlertSent = false;
bool phHighAlertSent = false;
bool waterLowAlertSent = false;
unsigned long lastEmailSent = 0;
const unsigned long EMAIL_COOLDOWN = 300000; // 5 min

void setup() {
  Serial.begin(115200);

  slope = (pH2 - pH1) / (voltage2 - voltage1);
  intercept = pH1 - slope * voltage1;

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void loop() {
  if (millis() - lastSensorSend > 3000) {
    sendSensorData();
    lastSensorSend = millis();
  }

  if (millis() - lastPumpCheck > 1000) {
    checkPumpStatus();
    lastPumpCheck = millis();
  }
}

float readPH() {
  const int numReadings = 10;
  float sum = 0;
  for (int i = 0; i < numReadings; i++) {
    int adc = analogRead(PH_PIN);
    float voltage = adc * (VREF / ADC_RESOLUTION);
    sum += voltage;
    delay(10);
  }
  float avgVoltage = sum / numReadings;
  float phValue = slope * avgVoltage + intercept;
  return constrain(phValue, 0, 14);
}

float readWaterLevel() {
  const int numReadings = 5;
  float readings[numReadings];

  for (int i = 0; i < numReadings; i++) {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    readings[i] = (duration == 0) ? -1 : (duration * SOUND_SPEED / 2) * 10;
    delay(50);
  }

  int validCount = 0;
  float validReadings[numReadings];
  for (int i = 0; i < numReadings; i++)
    if (readings[i] > 0) validReadings[validCount++] = readings[i];

  if (validCount == 0) return 0;

  // simple sort
  for (int i = 0; i < validCount - 1; i++)
    for (int j = i + 1; j < validCount; j++)
      if (validReadings[i] > validReadings[j]) {
        float temp = validReadings[i];
        validReadings[i] = validReadings[j];
        validReadings[j] = temp;
      }

  float medianDistance = validReadings[validCount / 2];
  float waterLevel = TANK_HEIGHT - medianDistance;
  return constrain(waterLevel, 0, TANK_HEIGHT);
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;

  float ph = readPH();
  float waterLevel = readWaterLevel();

  Serial.print("pH: "); Serial.println(ph);
  Serial.print("Water: "); Serial.println(waterLevel);

  // Send sensor data to server
  sendSensorDataToServer(ph, waterLevel, pumpStatus);

  checkAndSendAlerts(ph, waterLevel);
}

void checkPumpStatus() {
  // Automatic pump control
  if (readWaterLevel() >= 200) {
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpStatus = true;
  } else {
    digitalWrite(PUMP_RELAY_PIN, LOW);
    pumpStatus = false;
  }
}

void checkAndSendAlerts(float ph, float waterLevel) {
  if (millis() - lastEmailSent < EMAIL_COOLDOWN) return;

  bool alertTriggered = false;
  String subject = "Hydroponics System Alert";
  String message = "";

  if (ph < 5.0 && !phLowAlertSent) {
    message += "⚠️ pH too low: " + String(ph) + "\n";
    phLowAlertSent = true; phHighAlertSent = false;
    alertTriggered = true;
  } else if (ph > 7.5 && !phHighAlertSent) {
    message += "⚠️ pH too high: " + String(ph) + "\n";
    phHighAlertSent = true; phLowAlertSent = false;
    alertTriggered = true;
  } else if (ph >= 5.0 && ph <= 7.5) {
    phLowAlertSent = false; phHighAlertSent = false;
  }

  if (waterLevel < 200 && !waterLowAlertSent) {
    message += "⚠️ Water low: " + String(waterLevel) + "mm\n";
    waterLowAlertSent = true;
    alertTriggered = true;
  } else if (waterLevel >= 200) waterLowAlertSent = false;

  if (alertTriggered) {
    sendEmail(subject, message);
    lastEmailSent = millis();
  }
}

void sendSensorDataToServer(float ph, float waterLevel, bool pumpStatus) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(sensorServerUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"ph\":" + String(ph, 2) + ",";
  payload += "\"water_level\":" + String(waterLevel, 1) + ",";
  payload += "\"pump_status\":" + String(pumpStatus ? "true" : "false");
  payload += "}";

  int code = http.POST(payload);
  if (code == 200) {
    Serial.println("Sensor data sent to server!");
  } else {
    Serial.println("Failed to send sensor data: " + String(code));
  }

  http.end();
}

void sendEmail(String subject, String body) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(emailServerUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"subject\":\"" + subject + "\",";
  payload += "\"body\":\"" + body + "\"";
  payload += "}";

  int code = http.POST(payload);
  if (code > 0) Serial.println("Email triggered via server!");
  else Serial.println("Failed to trigger email: " + String(code));

  http.end();
}
