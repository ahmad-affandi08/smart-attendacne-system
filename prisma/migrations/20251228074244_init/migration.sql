-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "uid" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rfid',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MasterCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_nis_key" ON "Student"("nis");

-- CreateIndex
CREATE INDEX "Student_nis_idx" ON "Student"("nis");

-- CreateIndex
CREATE INDEX "Student_isActive_idx" ON "Student"("isActive");

-- CreateIndex
CREATE INDEX "AttendanceLog_studentId_idx" ON "AttendanceLog"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceLog_timestamp_idx" ON "AttendanceLog"("timestamp");

-- CreateIndex
CREATE INDEX "AttendanceLog_status_idx" ON "AttendanceLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MasterCard_uid_key" ON "MasterCard"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");
