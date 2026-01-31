#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

/* ================= WIFI CONFIG ================= */
const char* ssid = "wifi.id"; 
const char* password = "43214321"; 

/* ================= TELEGRAM CONFIG ================= */
const char* botToken = "8585194663:AAF7WBF3hwXo-q9zx9tpYrwnhiwBSpNToks";
const char* chatID = "8313729039";

ESP8266WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

/* ================= PIN ================= */
#define SS_PIN     D2
#define RST_PIN    D1
#define BUZZER_PIN D8

MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

/* ============ MODE SCAN ============ */
String lastScannedUID = "";

/* ============ DEBOUNCING ============ */
unsigned long lastReadTime = 0;
const unsigned long READ_DELAY = 2000;

// Forward declarations
void setupWiFi();
void sendTelegramMessage(String message);
void updateLCD();
void beep(int count);
void prosesKartuRFID();
void handleSerialCommand();
void handleCommand(String cmd);
String bacaUID();
void kirimUIDKeWeb(String uid);
void beepSuccess();
void beepError();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
void handleRoot();
void handleStatus();
void tampilkanMenuHelp();
void tampilkanStatus();

/* ======================================= */
void setup() {
  Serial.begin(115200);
  Serial.setTimeout(50);
  Serial.println("\n\n=== RFID READER SYSTEM ===");
  Serial.println("Mode: Reader Only (Semua data di Web/Database)");
  
  pinMode(BUZZER_PIN, OUTPUT);
  
  Wire.begin(0, 2);
  lcd.init();
  lcd.backlight();
  
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("RFID READER");
  lcd.setCursor(0,1);
  lcd.print("STARTING...");
  delay(1000);
  
  setupWiFi();
  
  SPI.begin();
  mfrc522.PCD_Init();
  
  byte version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("RFID Version: 0x");
  Serial.println(version, HEX);
  
  updateLCD();
  Serial.println("Sistem siap!");
  Serial.println("ESP8266 berfungsi sebagai RFID Reader");
  Serial.println("Semua data & logika ada di Web/Database");
  Serial.println("Ketik 'HELP' untuk menu serial");
  
  beep(1);
}

/* ======================================= */
void loop() {
  server.handleClient();
  webSocket.loop();
  
  if (Serial.available()) {
    handleSerialCommand();
  }
  
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    prosesKartuRFID();
  }
  
  static unsigned long lastLCDUpdate = 0;
  if (millis() - lastLCDUpdate > 1000) {
    updateLCD();
    lastLCDUpdate = millis();
  }
}

/* ============= PROSES KARTU RFID ============== */
void prosesKartuRFID() {
  unsigned long currentTime = millis();
  if (currentTime - lastReadTime < READ_DELAY) {
    mfrc522.PICC_HaltA();
    return;
  }
  lastReadTime = currentTime;
  
  String uid = bacaUID();
  lastScannedUID = uid;
  
  Serial.print("[RFID] UID Terdeteksi: ");
  Serial.println(uid);
  
  // Kirim UID ke Web untuk diproses
  kirimUIDKeWeb(uid);
  
  // Tampilkan di LCD
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("KARTU TERDETEKSI");
  lcd.setCursor(0,1);
  lcd.print(uid.substring(0, 16));
  
  beep(1);
  delay(1500);
  updateLCD();
  
  mfrc522.PICC_HaltA();
}

/* ============= BACA UID ============== */
String bacaUID() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();
  return uid;
}

/* ============= KIRIM UID KE WEB ============== */
void kirimUIDKeWeb(String uid) {
  // Format: RFID_SCAN:UID
  String message = "RFID_SCAN:" + uid;
  
  // Kirim ke WebSocket (prioritas)
  webSocket.broadcastTXT(message);
  
  // Print ke Serial
  Serial.println(message);
  
  // Notifikasi Telegram
  String telegramMsg = "KARTU TERDETEKSI!\n\n";
  telegramMsg += "UID: " + uid + "\n";
  telegramMsg += "Waktu: " + String(millis()/1000) + "s";
  sendTelegramMessage(telegramMsg);
}

/* ============= HANDLE SERIAL COMMAND ============== */
void handleSerialCommand() {
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  if (cmd.length() == 0) return;
  
  Serial.print("[CMD] ");
  Serial.println(cmd);
  
  handleCommand(cmd);
}

/* ============= HANDLE COMMAND (UNIFIED) ============== */
void handleCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;
  
  String cmdUpper = cmd;
  cmdUpper.toUpperCase();
  
  if (cmdUpper == "HELP") {
    tampilkanMenuHelp();
  }
  else if (cmdUpper == "STATUS") {
    tampilkanStatus();
  }
  else if (cmd.startsWith("LCD:")) {
    // Web bisa mengontrol LCD
    // Format: LCD:Baris1|Baris2
    int separator = cmd.indexOf('|');
    if (separator > 0) {
      String line1 = cmd.substring(4, separator);
      String line2 = cmd.substring(separator + 1);
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print(line1.substring(0, 16));
      lcd.setCursor(0, 1);
      lcd.print(line2.substring(0, 16));
      
      Serial.println("WEB_OK: LCD updated");
      webSocket.broadcastTXT("WEB_OK: LCD updated");
    }
  }
  else if (cmdUpper == "BEEP_SUCCESS") {
    beepSuccess();
    Serial.println("WEB_OK: Beep success");
  }
  else if (cmdUpper == "BEEP_ERROR") {
    beepError();
    Serial.println("WEB_OK: Beep error");
  }
  else if (cmdUpper == "BEEP") {
    beep(1);
    Serial.println("WEB_OK: Beep");
  }
  else if (cmd.length() > 0) {
    String error = "WEB_ERROR: Command tidak dikenal: " + cmd;
    Serial.println(error);
    webSocket.broadcastTXT(error);
  }
}

/* ============= TAMPILKAN STATUS ============== */
void tampilkanStatus() {
  Serial.println("\n=== STATUS SISTEM ===");
  Serial.println("Mode: RFID Reader Only");
  Serial.println("Fungsi: Membaca UID dan kirim ke Web");
  Serial.println("Data: Semua tersimpan di Web/Database");
  Serial.print("Last Scanned UID: ");
  Serial.println(lastScannedUID.length() > 0 ? lastScannedUID : "Belum ada");
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "Tidak terhubung");
  Serial.println("=====================\n");
}

/* ============= TAMPILKAN MENU HELP ============== */
void tampilkanMenuHelp() {
  Serial.println("\n=== MENU PERINTAH ===");
  Serial.println("HELP                - Tampilkan menu ini");
  Serial.println("STATUS              - Status sistem");
  Serial.println("BEEP                - Test buzzer");
  Serial.println("BEEP_SUCCESS        - Beep sukses");
  Serial.println("BEEP_ERROR          - Beep error");
  Serial.println("LCD:Text1|Text2     - Update LCD display");
  Serial.println("");
  Serial.println("Sistem ini hanya READER, semua data di Web/Database");
  Serial.println("Format output: RFID_SCAN:UID");
  Serial.println("=====================\n");
}

/* ============= UPDATE LCD ============== */
void updateLCD() {
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("RFID READER");
  lcd.setCursor(0,1);
  
  if (WiFi.status() == WL_CONNECTED) {
    lcd.print("READY - SCAN");
  } else {
    lcd.print("WiFi OFFLINE");
  }
}

/* ============= BEEP FUNCTIONS ============== */
void beep(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < count - 1) delay(100);
  }
}

void beepSuccess() {
  for (int i = 200; i <= 800; i += 100) {
    tone(BUZZER_PIN, i, 50);
    delay(60);
  }
  noTone(BUZZER_PIN);
}

void beepError() {
  for (int i = 800; i >= 200; i -= 100) {
    tone(BUZZER_PIN, i, 50);
    delay(60);
  }
  noTone(BUZZER_PIN);
}

/* ============= WIFI SETUP ============== */
void setupWiFi() {
  Serial.println("\n=== Setup WiFi ===");
  
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Connecting WiFi");
  lcd.setCursor(0,1);
  lcd.print("Please wait...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0,1);
    lcd.print(WiFi.localIP().toString());
    delay(3000);
    
    // Kirim IP address ke Telegram
    String telegramMsg = "RFID Reader System\n\n";
    telegramMsg += "WiFi Terhubung!\n";
    telegramMsg += "Mode: Reader Only\n";
    telegramMsg += "IP Address: " + WiFi.localIP().toString() + "\n";
    telegramMsg += "WebSocket: ws://" + WiFi.localIP().toString() + ":81\n";
    telegramMsg += "HTTP: http://" + WiFi.localIP().toString() + "\n\n";
    telegramMsg += "Semua data tersimpan di Web/Database";
    sendTelegramMessage(telegramMsg);
    
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    
    server.on("/", handleRoot);
    server.on("/status", handleStatus);
    server.begin();
    
    Serial.println("WebSocket Server started on port 81");
    Serial.println("HTTP Server started on port 80");
  } else {
    Serial.println("\nWiFi Connection Failed!");
    Serial.println("Running in Serial-only mode");
    
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("WiFi FAILED");
    lcd.setCursor(0,1);
    lcd.print("Serial Mode");
    delay(2000);
  }
}

/* ============= SEND TELEGRAM MESSAGE ============== */
void sendTelegramMessage(String message) {
  // Validasi token dan chat ID
  if (String(botToken) == "YOUR_BOT_TOKEN_HERE" || String(chatID) == "YOUR_CHAT_ID_HERE") {
    Serial.println("[Telegram] Token atau Chat ID belum diatur!");
    Serial.println("Edit code dan ganti botToken & chatID dengan nilai yang benar");
    return;
  }
  
  WiFiClientSecure client;
  client.setInsecure(); // Skip certificate validation
  
  HTTPClient http;
  
  // URL encode pesan untuk menghindari error 400
  message.replace(" ", "%20");
  message.replace("\n", "%0A");
  message.replace(":", "%3A");
  message.replace("/", "%2F");
  message.replace("`", "%60");
  message.replace("*", "%2A");
  message.replace("_", "%5F");
  
  String url = "https://api.telegram.org/bot";
  url += botToken;
  url += "/sendMessage?chat_id=";
  url += chatID;
  url += "&text=";
  url += message;
  
  Serial.println("[Telegram] Mengirim pesan...");
  
  if (http.begin(client, url)) {
    int httpCode = http.GET();
    
    if (httpCode > 0) {
      Serial.printf("[Telegram] Response code: %d\n", httpCode);
      if (httpCode == HTTP_CODE_OK || httpCode == 200) {
        String payload = http.getString();
        Serial.println("[Telegram] ✅ Pesan berhasil dikirim!");
      } else {
        String payload = http.getString();
        Serial.println("[Telegram] ⚠️ Pesan gagal dikirim");
        Serial.println("[Telegram] Response: " + payload);
      }
    } else {
      Serial.printf("[Telegram] ❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[Telegram] ❌ Tidak dapat terhubung ke server");
  }
}

/* ============= WEBSOCKET EVENT ============== */
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      if (Serial) Serial.printf("[%u] Disconnected!\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      if (Serial) Serial.printf("[%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      webSocket.sendTXT(num, "WEB_OK: Connected to RFID Reader");
      
      // Notifikasi Telegram: Web terhubung
      String telegramMsg = "WEB TERHUBUNG!\n\n";
      telegramMsg += "Client IP: " + ip.toString() + "\n";
      telegramMsg += "Mode: Reader Only";
      sendTelegramMessage(telegramMsg);
      break;
    }
    
    case WStype_TEXT: {
      String cmd = String((char*)payload);
      cmd.trim();
      if (Serial) Serial.printf("[%u] Command: %s\n", num, cmd.c_str());
      
      // Notifikasi Telegram: Command diterima
      String telegramMsg = "COMMAND DITERIMA\n\n";
      telegramMsg += "Command: " + cmd;
      sendTelegramMessage(telegramMsg);
      
      handleCommand(cmd);
      break;
    }
  }
}

/* ============= HTTP HANDLERS ============== */
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>RFID Reader</title>";
  html += "<style>body{font-family:Arial;margin:20px;background:#f0f0f0;}";
  html += ".card{background:white;padding:20px;border-radius:10px;margin:10px 0;box-shadow:0 2px 5px rgba(0,0,0,0.1);}";
  html += "h1{color:#333;}p{color:#666;}</style></head><body>";
  html += "<div class='card'><h1>📡 RFID Reader System</h1>";
  html += "<p>ESP8266 RFID Reader - Data tersimpan di Web/Database</p></div>";
  html += "<div class='card'><h2>Status</h2>";
  html += "<p>Mode: <b>Reader Only</b></p>";
  html += "<p>WiFi: <b>Connected</b></p>";
  html += "<p>IP Address: <b>" + WiFi.localIP().toString() + "</b></p>";
  html += "<p>WebSocket: ws://" + WiFi.localIP().toString() + ":81</p>";
  html += "<p>Last Scanned: <b>" + (lastScannedUID.length() > 0 ? lastScannedUID : "Belum ada") + "</b></p></div>";
  html += "<div class='card'><p>Format output: <code>RFID_SCAN:UID</code></p>";
  html += "<p>Gunakan WebSocket client untuk komunikasi real-time</p></div>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  String json = "{";
  json += "\"mode\":\"READER_ONLY\",";
  json += "\"lastScannedUID\":\"" + lastScannedUID + "\",";
  json += "\"wifi\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"uptime\":" + String(millis()) + "";
  json += "}";
  
  server.send(200, "application/json", json);
}
