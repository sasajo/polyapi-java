/*
  Warnings:

  - Made the column `alias` on table `PolyFunction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `context` on table `PolyFunction` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PolyFunction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "payload" TEXT,
    "method" TEXT,
    "url" TEXT,
    "headers" TEXT,
    "body" TEXT,
    "response" TEXT,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "publicId" TEXT NOT NULL,
    CONSTRAINT "PolyFunction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PolyFunction" ("alias", "body", "context", "headers", "id", "method", "payload", "publicId", "response", "trained", "url", "userId") SELECT COALESCE("alias", ''), "body", COALESCE("context", ''), "headers", "id", "method", "payload", "publicId", "response", "trained", "url", "userId" FROM "PolyFunction";
DROP TABLE "PolyFunction";
ALTER TABLE "new_PolyFunction" RENAME TO "PolyFunction";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
