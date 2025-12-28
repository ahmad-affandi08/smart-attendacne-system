-- CreateTable
CREATE TABLE "ProgramStudi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "prodiId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "ProgramStudi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("class", "createdAt", "id", "name", "nis", "uid", "updatedAt") SELECT "class", "createdAt", "id", "name", "nis", "uid", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_nis_key" ON "Student"("nis");
CREATE UNIQUE INDEX "Student_uid_key" ON "Student"("uid");
CREATE INDEX "Student_nis_idx" ON "Student"("nis");
CREATE INDEX "Student_uid_idx" ON "Student"("uid");
CREATE INDEX "Student_prodiId_idx" ON "Student"("prodiId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProgramStudi_code_key" ON "ProgramStudi"("code");

-- CreateIndex
CREATE INDEX "ProgramStudi_code_idx" ON "ProgramStudi"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
