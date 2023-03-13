/*
  Warnings:

  - Made the column `method` on table `PolyFunction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `PolyFunction` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiKey" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER'
);
INSERT INTO User ("apiKey", "id", "name") SELECT "apiKey", "id", "name" FROM User;
DROP TABLE User;
ALTER TABLE User RENAME TO "User";
CREATE UNIQUE INDEX "User_apiKey_key" ON User("apiKey");
CREATE TABLE "new_PolyFunction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "payload" TEXT,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headers" TEXT,
    "body" TEXT,
    "response" TEXT,
    "responseType" TEXT,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "publicId" TEXT NOT NULL,
    "webhookHandleId" TEXT,
    CONSTRAINT "PolyFunction_userId_fkey" FOREIGN KEY ("userId") REFERENCES User ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PolyFunction_webhookHandleId_fkey" FOREIGN KEY ("webhookHandleId") REFERENCES "WebhookHandle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PolyFunction" ("alias", "body", "context", "headers", "id", "method", "payload", "publicId", "response", "responseType", "trained", "url", "userId", "webhookHandleId") SELECT "alias", "body", "context", "headers", "id", COALESCE("method", ''), "payload", "publicId", "response", "responseType", "trained", COALESCE("url", ''), "userId", "webhookHandleId" FROM "PolyFunction";
DROP TABLE "PolyFunction";
ALTER TABLE "new_PolyFunction" RENAME TO "PolyFunction";
CREATE UNIQUE INDEX "PolyFunction_webhookHandleId_key" ON "PolyFunction"("webhookHandleId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
