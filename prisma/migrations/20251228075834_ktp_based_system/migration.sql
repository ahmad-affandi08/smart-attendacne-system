/*
  Warnings:

  - You are about to drop the `MasterCard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isActive` on the `Student` table. All the data in the column will be lost.
  - Made the column `uid` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "MasterCard_uid_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MasterCard";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'KTM',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceLog" ("class", "id", "source", "status", "studentId", "studentName", "timestamp", "uid") SELECT "class", "id", "source", "status", "studentId", "studentName", "timestamp", "uid" FROM "AttendanceLog";
DROP TABLE "AttendanceLog";
ALTER TABLE "new_AttendanceLog" RENAME TO "AttendanceLog";
CREATE INDEX "AttendanceLog_studentId_idx" ON "AttendanceLog"("studentId");
CREATE INDEX "AttendanceLog_timestamp_idx" ON "AttendanceLog"("timestamp");
CREATE INDEX "AttendanceLog_status_idx" ON "AttendanceLog"("status");
CREATE INDEX "AttendanceLog_uid_idx" ON "AttendanceLog"("uid");
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Student" ("class", "createdAt", "id", "name", "nis", "uid", "updatedAt") SELECT "class", "createdAt", "id", "name", "nis", "uid", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_nis_key" ON "Student"("nis");
CREATE UNIQUE INDEX "Student_uid_key" ON "Student"("uid");
CREATE INDEX "Student_nis_idx" ON "Student"("nis");
CREATE INDEX "Student_uid_idx" ON "Student"("uid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
