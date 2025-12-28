#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <MFRC522.h>
#include <EEPROM.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

/* ================= WIFI CONFIG ================= */
const char* ssid = "Tomoro Smooking Room";        // Nama WiFi Anda
const char* password = "maospatisragen"; // Ganti dengan password WiFi Anda

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

/* ============== DATA Mahasiswa ============== */
struct DataMahasiswa {
  String nama;
  String kelas;
  String nis;
  String uid;
  unsigned long lastAttendance;
  unsigned long lastAttendanceDay;
};

DataMahasiswa daftarMahasiswa[50];
int totalMahasiswa = 0;

/* ============ MODE SCAN ============ */
String lastScannedUID = "";

/* ============ SESSION ID (INCREMENT SETIAP RESTART) ============ */
unsigned long currentSessionID = 0;

unsigned long getCurrentDay() {
  // Gunakan sessionID, bukan millis() yang reset setiap restart
  return currentSessionID;
}

/* ============ LOG ABSENSI ============ */
struct LogAbsensi {
  String uid;
  String nama;
  String kelas;
  String status;
  String waktu;
};
LogAbsensi logAbsensi[100];
int totalLog = 0;

/* ============ MODE SISTEM ============ */
enum ModeSistem {
  MODE_NORMAL,
  MODE_REGISTER
};
ModeSistem modeSaatIni = MODE_NORMAL;

/* ============ DEBOUNCING ============ */
unsigned long lastReadTime = 0;
const unsigned long READ_DELAY = 2000;

/* ============ EEPROM ============ */
#define EEPROM_SIZE 1024
#define EEPROM_DATA_ADDR 100

// Forward declarations
void setupWiFi();
void sendTelegramMessage(String message);
void updateLCD();
void beep(int count);
void loadDataFromEEPROM();
void prosesKartuRFID();
void handleSerialCommand();
void handleCommand(String cmd);
String bacaUID();
void prosesModeNormal(String uidNormalized);
void prosesModeRegister(String uidNormalized);
void kirimKeWeb(String uid, String nama, String kelas, String status);
void saveDataToEEPROM();
void beepSuccess();
void beepError();
void clearEEPROM();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
void handleRoot();
void handleStatus();
void tampilkanMenuHelp();
void tampilkanStatus();
void tampilkanDaftarMahasiswa();
void tampilkanLogAbsensi();
void tambahMahasiswaDariWeb(String cmd);
void resetData();

/* ======================================= */
void setup() {
  Serial.begin(115200);
  Serial.setTimeout(50); // Timeout 50ms untuk Serial operations
  Serial.println("\n\n=== SISTEM ABSENSI KTP INDIVIDUAL ===");
  
  pinMode(BUZZER_PIN, OUTPUT);
  
  Wire.begin(0, 2);
  lcd.init();
  lcd.backlight();
  
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("ABSENSI KTP");
  lcd.setCursor(0,1);
  lcd.print("STARTING...");
  delay(1000);
  
  setupWiFi();
  
  SPI.begin();
  mfrc522.PCD_Init();
  
  byte version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("RFID Version: 0x");
  Serial.println(version, HEX);
  
  loadDataFromEEPROM();
  
  updateLCD();
  Serial.println("Sistem siap!");
  Serial.println("Format ke Web: WEB,UID,NAMA,KELAS,STATUS");
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
  
  // Debug print (optional)
  if (Serial) {
    Serial.print("[RFID] UID: ");
    Serial.println(uid);
  }
  
  String uidNormalized = uid;
  uidNormalized.replace(" ", "");
  
  switch (modeSaatIni) {
    case MODE_NORMAL:
      prosesModeNormal(uidNormalized);
      break;
    case MODE_REGISTER:
      prosesModeRegister(uidNormalized);
      break;
  }
  
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

/* ============= MODE NORMAL (ABSENSI) ============== */
void prosesModeNormal(String uidNormalized) {
  int foundIndex = -1;
  for (int i = 0; i < totalMahasiswa; i++) {
    String mahasiswaUID = daftarMahasiswa[i].uid;
    mahasiswaUID.replace(" ", "");
    
    if (mahasiswaUID == uidNormalized) {
      foundIndex = i;
      break;
    }
  }
  
  if (foundIndex >= 0) {
    DataMahasiswa mahasiswa = daftarMahasiswa[foundIndex];
    unsigned long hariIni = getCurrentDay();
    
    if (daftarMahasiswa[foundIndex].lastAttendanceDay == hariIni) {
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("SUDAH ABSEN!");
      lcd.setCursor(0,1);
      lcd.print(mahasiswa.nama.substring(0, 16));
      
      kirimKeWeb(lastScannedUID, mahasiswa.nama, mahasiswa.kelas, "SUDAH_ABSEN");
      
      beepError();
      delay(2000);
      updateLCD();
      return;
    }
    
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("HADIR:");
    lcd.setCursor(0,1);
    lcd.print(mahasiswa.nama.substring(0, 16));
    
    kirimKeWeb(lastScannedUID, mahasiswa.nama, mahasiswa.kelas, "HADIR");
    
    daftarMahasiswa[foundIndex].lastAttendance = millis();
    daftarMahasiswa[foundIndex].lastAttendanceDay = hariIni;
    saveDataToEEPROM();
    
    beepSuccess();
    delay(2000);
    updateLCD();
    
  } else {
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("KTP TIDAK");
    lcd.setCursor(0,1);
    lcd.print("TERDAFTAR!");
    
    kirimKeWeb(lastScannedUID, "UNKNOWN", "UNKNOWN", "DITOLAK");
    
    beepError();
    delay(2000);
    updateLCD();
  }
}

/* ============= MODE REGISTER Mahasiswa ============== */
void prosesModeRegister(String uidNormalized) {
  String message = "WEB_SCAN_KTP:" + lastScannedUID;
  
  // Kirim ke WebSocket DULU (prioritas)
  webSocket.broadcastTXT(message);
  
  // Notifikasi Telegram: KTP di-scan
  String telegramMsg = "KTP TERDETEKSI!\n\n";
  telegramMsg += "UID: " + lastScannedUID + "\n";
  telegramMsg += "Mode: REGISTER";
  sendTelegramMessage(telegramMsg);
  
  // Baru print ke Serial (optional)
  if (Serial) Serial.println(message);
  
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("KTP TERDETEKSI");
  lcd.setCursor(0,1);
  lcd.print(lastScannedUID.substring(0, 16));
  
  beep(2);
  delay(1500);
  
  modeSaatIni = MODE_NORMAL;
  updateLCD();
}

/* ============= KIRIM DATA KE WEB ============== */
void kirimKeWeb(String uid, String nama, String kelas, String status) {
  String message = "WEB," + uid + "," + nama + "," + kelas + "," + status;
  
  // Kirim ke WebSocket DULU (prioritas)
  webSocket.broadcastTXT(message);
  
  // Baru print ke Serial (optional)
  if (Serial) Serial.println(message);
  
  if (totalLog < 100) {
    logAbsensi[totalLog].uid = uid;
    logAbsensi[totalLog].nama = nama;
    logAbsensi[totalLog].kelas = kelas;
    logAbsensi[totalLog].status = status;
    
    unsigned long seconds = millis() / 1000;
    unsigned long minutes = seconds / 60;
    unsigned long hours = minutes / 60;
    hours = hours % 24;
    minutes = minutes % 60;
    seconds = seconds % 60;
    
    String waktu = String(hours) + ":" + (minutes < 10 ? "0" : "") + String(minutes) + ":" + (seconds < 10 ? "0" : "") + String(seconds);
    logAbsensi[totalLog].waktu = waktu;
    
    totalLog++;
  }
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
  else if (cmdUpper == "MODE_NORMAL") {
    modeSaatIni = MODE_NORMAL;
    String response = "WEB_OK: Mode Normal";
    Serial.println(response);
    webSocket.broadcastTXT(response);
    updateLCD();
  }
  else if (cmdUpper == "MODE_REGISTER" || cmdUpper == "SCAN") {
    modeSaatIni = MODE_REGISTER;
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("SCAN KTP");
    lcd.setCursor(0,1);
    lcd.print("MAHASISWA BARU");
    String response = "WEB_OK: Mode scan KTP registrasi";
    Serial.println(response);
    webSocket.broadcastTXT(response);
  }
  else if (cmdUpper == "LIST_Mahasiswa") {
    tampilkanDaftarMahasiswa();
  }
  else if (cmd.startsWith("ADD_Mahasiswa,")) {
    tambahMahasiswaDariWeb(cmd);
  }
  else if (cmdUpper == "GET_LOG") {
    tampilkanLogAbsensi();
  }
  else if (cmdUpper == "RESET") {
    resetData();
  }
  else if (cmd.length() > 0) {
    String error = "WEB_ERROR: Command tidak dikenal: " + cmd;
    Serial.println(error);
    webSocket.broadcastTXT(error);
  }
}

/* ============= TAMBAH Mahasiswa DARI WEB ============== */
void tambahMahasiswaDariWeb(String cmd) {
  int firstComma = cmd.indexOf(',');
  int secondComma = cmd.indexOf(',', firstComma + 1);
  int thirdComma = cmd.indexOf(',', secondComma + 1);
  int fourthComma = cmd.indexOf(',', thirdComma + 1);
  
  if (firstComma != -1 && secondComma != -1 && thirdComma != -1 && fourthComma != -1) {
    String nama = cmd.substring(firstComma + 1, secondComma);
    String kelas = cmd.substring(secondComma + 1, thirdComma);
    String nis = cmd.substring(thirdComma + 1, fourthComma);
    String uid = cmd.substring(fourthComma + 1);
    
    uid.trim();
    uid.toUpperCase();
    
    if (totalMahasiswa < 50) {
      daftarMahasiswa[totalMahasiswa].nama = nama;
      daftarMahasiswa[totalMahasiswa].kelas = kelas;
      daftarMahasiswa[totalMahasiswa].nis = nis;
      daftarMahasiswa[totalMahasiswa].uid = uid;
      daftarMahasiswa[totalMahasiswa].lastAttendance = 0;
      daftarMahasiswa[totalMahasiswa].lastAttendanceDay = 0; // Session ID 0 = belum pernah absen
      
      totalMahasiswa++;
      saveDataToEEPROM();
      
      String response = "WEB_OK: Mahasiswa ditambahkan - " + nama + " (Total: " + String(totalMahasiswa) + ")";
      Serial.println(response);
      webSocket.broadcastTXT(response);
      
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("DITAMBAH:");
      lcd.setCursor(0,1);
      lcd.print(nama.substring(0, 16));
      
      beepSuccess();
      delay(1500);
      updateLCD();
      
    } else {
      Serial.println("WEB_ERROR: Kapasitas Mahasiswa penuh!");
    }
  } else {
    Serial.println("WEB_ERROR: Format: ADD_Mahasiswa,nama,kelas,nis,uid");
  }
}

/* ============= TAMPILKAN STATUS ============== */
void tampilkanStatus() {
  Serial.println("\n=== STATUS SISTEM ===");
  Serial.print("Mode: ");
  switch (modeSaatIni) {
    case MODE_NORMAL: Serial.println("NORMAL"); break;
    case MODE_REGISTER: Serial.println("REGISTER (SCAN KTP)"); break;
  }
  
  Serial.print("Total Mahasiswa: ");
  Serial.println(totalMahasiswa);
  
  Serial.print("Total Log Absensi: ");
  Serial.println(totalLog);
  Serial.println("=====================\n");
}

/* ============= TAMPILKAN DAFTAR Mahasiswa ============== */
void tampilkanDaftarMahasiswa() {
  Serial.println("\n=== DAFTAR Mahasiswa ===");
  if (totalMahasiswa == 0) {
    Serial.println("Belum ada Mahasiswa terdaftar");
  } else {
    for (int i = 0; i < totalMahasiswa; i++) {
      Serial.print(i + 1);
      Serial.print(". ");
      Serial.print(daftarMahasiswa[i].nama);
      Serial.print(" | ");
      Serial.print(daftarMahasiswa[i].kelas);
      Serial.print(" | ");
      Serial.print(daftarMahasiswa[i].nis);
      Serial.print(" | UID: ");
      Serial.println(daftarMahasiswa[i].uid);
    }
  }
  Serial.println("=====================\n");
}

/* ============= TAMPILKAN LOG ABSENSI ============== */
void tampilkanLogAbsensi() {
  Serial.println("\n=== LOG ABSENSI ===");
  if (totalLog == 0) {
    Serial.println("Belum ada absensi");
  } else {
    int startIdx = (totalLog > 10) ? totalLog - 10 : 0;
    for (int i = startIdx; i < totalLog; i++) {
      Serial.print(i + 1);
      Serial.print(". ");
      Serial.print(logAbsensi[i].waktu);
      Serial.print(" | ");
      Serial.print(logAbsensi[i].nama);
      Serial.print(" | ");
      Serial.print(logAbsensi[i].kelas);
      Serial.print(" | ");
      Serial.println(logAbsensi[i].status);
    }
  }
  Serial.println("===================\n");
}

/* ============= TAMPILKAN MENU HELP ============== */
void tampilkanMenuHelp() {
  Serial.println("\n=== MENU PERINTAH ===");
  Serial.println("HELP                - Tampilkan menu ini");
  Serial.println("STATUS              - Status sistem");
  Serial.println("MODE_NORMAL         - Mode absensi normal");
  Serial.println("MODE_REGISTER       - Mode scan KTP registrasi");
  Serial.println("LIST_Mahasiswa      - Daftar semua Mahasiswa");
  Serial.println("GET_LOG             - Tampilkan log absensi");
  Serial.println("SCAN                - Mode scan KTP");
  Serial.println("RESET               - Hapus SEMUA data (EEPROM + RAM)");
  Serial.println("");
  Serial.println("Format tambah Mahasiswa:");
  Serial.println("  ADD_Mahasiswa,nama,kelas,nis,uid");
  Serial.println("");
  Serial.println("=====================\n");
}

/* ============= RESET DATA ============== */
void resetData() {
  totalMahasiswa = 0;
  totalLog = 0;
  
  clearEEPROM();
  
  Serial.println("WEB_OK: Semua data direset");
  
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("DATA DIHAPUS");
  lcd.setCursor(0,1);
  lcd.print("SISTEM RESET");
  
  beep(3);
  delay(2000);
  updateLCD();
}

/* ============= UPDATE LCD ============== */
void updateLCD() {
  lcd.clear();
  
  if (modeSaatIni == MODE_REGISTER) {
    lcd.setCursor(0,0);
    lcd.print("SCAN KTP");
    lcd.setCursor(0,1);
    lcd.print("MAHASISWA BARU");
    return;
  }
  
  lcd.setCursor(0,0);
  lcd.print("ABSENSI KTP");
  
  lcd.setCursor(0,1);
  if (totalMahasiswa > 0) {
    lcd.print("MHS: ");
    lcd.print(totalMahasiswa);
    lcd.print(" TERDAFTAR");
  } else {
    lcd.print("BELUM ADA MHS");
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

/* ============= EEPROM FUNCTIONS ============== */
void loadDataFromEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
  
  // Load dan increment session ID (alamat 0-3)
  currentSessionID = 0;
  currentSessionID |= ((unsigned long)EEPROM.read(0)) << 24;
  currentSessionID |= ((unsigned long)EEPROM.read(1)) << 16;
  currentSessionID |= ((unsigned long)EEPROM.read(2)) << 8;
  currentSessionID |= ((unsigned long)EEPROM.read(3));
  
  // Increment untuk session baru (setiap restart bertambah)
  currentSessionID++;
  
  // Simpan session ID yang baru
  EEPROM.write(0, (currentSessionID >> 24) & 0xFF);
  EEPROM.write(1, (currentSessionID >> 16) & 0xFF);
  EEPROM.write(2, (currentSessionID >> 8) & 0xFF);
  EEPROM.write(3, currentSessionID & 0xFF);
  EEPROM.commit();
  
  if (Serial) {
    Serial.print("[SESSION] Current Session ID: ");
    Serial.println(currentSessionID);
  }
  
  int addr = EEPROM_DATA_ADDR;
  totalMahasiswa = EEPROM.read(addr++);
  if (totalMahasiswa > 50) totalMahasiswa = 0;
  
  for (int i = 0; i < totalMahasiswa; i++) {
    byte namaLen = EEPROM.read(addr++);
    daftarMahasiswa[i].nama = "";
    for (int j = 0; j < namaLen; j++) {
      daftarMahasiswa[i].nama += char(EEPROM.read(addr++));
    }
    
    byte kelasLen = EEPROM.read(addr++);
    daftarMahasiswa[i].kelas = "";
    for (int j = 0; j < kelasLen; j++) {
      daftarMahasiswa[i].kelas += char(EEPROM.read(addr++));
    }
    
    byte nisLen = EEPROM.read(addr++);
    daftarMahasiswa[i].nis = "";
    for (int j = 0; j < nisLen; j++) {
      daftarMahasiswa[i].nis += char(EEPROM.read(addr++));
    }
    
    byte uidLen = EEPROM.read(addr++);
    daftarMahasiswa[i].uid = "";
    for (int j = 0; j < uidLen; j++) {
      daftarMahasiswa[i].uid += char(EEPROM.read(addr++));
    }
    
    daftarMahasiswa[i].lastAttendanceDay = 0;
    daftarMahasiswa[i].lastAttendanceDay |= ((unsigned long)EEPROM.read(addr++)) << 24;
    daftarMahasiswa[i].lastAttendanceDay |= ((unsigned long)EEPROM.read(addr++)) << 16;
    daftarMahasiswa[i].lastAttendanceDay |= ((unsigned long)EEPROM.read(addr++)) << 8;
    daftarMahasiswa[i].lastAttendanceDay |= ((unsigned long)EEPROM.read(addr++));
    
    daftarMahasiswa[i].lastAttendance = 0;
  }
  
  EEPROM.end();
}

void saveDataToEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
  
  int addr = EEPROM_DATA_ADDR;
  EEPROM.write(addr++, totalMahasiswa);
  
  for (int i = 0; i < totalMahasiswa; i++) {
    EEPROM.write(addr++, daftarMahasiswa[i].nama.length());
    for (int j = 0; j < daftarMahasiswa[i].nama.length(); j++) {
      EEPROM.write(addr++, daftarMahasiswa[i].nama[j]);
    }
    
    EEPROM.write(addr++, daftarMahasiswa[i].kelas.length());
    for (int j = 0; j < daftarMahasiswa[i].kelas.length(); j++) {
      EEPROM.write(addr++, daftarMahasiswa[i].kelas[j]);
    }
    
    EEPROM.write(addr++, daftarMahasiswa[i].nis.length());
    for (int j = 0; j < daftarMahasiswa[i].nis.length(); j++) {
      EEPROM.write(addr++, daftarMahasiswa[i].nis[j]);
    }
    
    EEPROM.write(addr++, daftarMahasiswa[i].uid.length());
    for (int j = 0; j < daftarMahasiswa[i].uid.length(); j++) {
      EEPROM.write(addr++, daftarMahasiswa[i].uid[j]);
    }
    
    EEPROM.write(addr++, (daftarMahasiswa[i].lastAttendanceDay >> 24) & 0xFF);
    EEPROM.write(addr++, (daftarMahasiswa[i].lastAttendanceDay >> 16) & 0xFF);
    EEPROM.write(addr++, (daftarMahasiswa[i].lastAttendanceDay >> 8) & 0xFF);
    EEPROM.write(addr++, daftarMahasiswa[i].lastAttendanceDay & 0xFF);
  }
  
  EEPROM.commit();
  EEPROM.end();
}

void clearEEPROM() {
  EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < EEPROM_SIZE; i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
  EEPROM.end();
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
    String telegramMsg = "Sistem Absensi KTP\n\n";
    telegramMsg += "WiFi Terhubung!\n";
    telegramMsg += "IP Address: " + WiFi.localIP().toString() + "\n";
    telegramMsg += "WebSocket: ws://" + WiFi.localIP().toString() + ":81\n";
    telegramMsg += "HTTP: http://" + WiFi.localIP().toString() + "\n\n";
    telegramMsg += "Total Mahasiswa: " + String(totalMahasiswa);
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
      webSocket.sendTXT(num, "WEB_OK: Connected to ESP8266");
      
      // Notifikasi Telegram: Web terhubung
      String telegramMsg = "WEB TERHUBUNG!\n\n";
      telegramMsg += "Client IP: " + ip.toString() + "\n";
      telegramMsg += "Total Mahasiswa: " + String(totalMahasiswa);
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
  String html = "<!DOCTYPE html><html><head><title>ESP8266 Absensi</title>";
  html += "<style>body{font-family:Arial;margin:20px;background:#f0f0f0;}";
  html += ".card{background:white;padding:20px;border-radius:10px;margin:10px 0;box-shadow:0 2px 5px rgba(0,0,0,0.1);}";
  html += "h1{color:#333;}p{color:#666;}</style></head><body>";
  html += "<div class='card'><h1>🎓 Sistem Absensi KTP</h1>";
  html += "<p>ESP8266 RFID Attendance System</p></div>";
  html += "<div class='card'><h2>Status</h2>";
  html += "<p>Total Mahasiswa: <b>" + String(totalMahasiswa) + "</b></p>";
  html += "<p>WiFi: <b>Connected</b></p>";
  html += "<p>IP Address: <b>" + WiFi.localIP().toString() + "</b></p>";
  html += "<p>WebSocket: ws://" + WiFi.localIP().toString() + ":81</p></div>";
  html += "<div class='card'><p>Gunakan WebSocket client untuk komunikasi real-time</p></div>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  String json = "{";
  json += "\"totalMahasiswa\":" + String(totalMahasiswa) + ",";
  json += "\"totalLog\":" + String(totalLog) + ",";
  json += "\"mode\":\"" + String(modeSaatIni == MODE_NORMAL ? "NORMAL" : "REGISTER") + "\",";
  json += "\"wifi\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"uptime\":" + String(millis()) + "";
  json += "}";
  
  server.send(200, "application/json", json);
}
