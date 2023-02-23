/*
  Warnings:

  - The required column `publicId` was added to the `PolyFunction` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PolyFunction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "alias" TEXT,
    "context" TEXT,
    "payload" TEXT,
    "method" TEXT,
    "url" TEXT,
    "headers" TEXT,
    "body" TEXT,
    "response" TEXT,
    "publicId" TEXT NOT NULL,
    CONSTRAINT "PolyFunction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PolyFunction" ("alias", "body", "context", "headers", "id", "method", "payload", "response", "url", "userId", "publicId") SELECT "alias", "body", "context", "headers", "id", "method", "payload", "response", "url", "userId", lower(hex(randomblob(16))) FROM "PolyFunction";
DROP TABLE "PolyFunction";
ALTER TABLE "new_PolyFunction" RENAME TO "PolyFunction";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
