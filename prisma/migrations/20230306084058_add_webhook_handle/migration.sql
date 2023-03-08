-- CreateTable
CREATE TABLE "WebhookHandle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "eventPayload" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    CONSTRAINT "WebhookHandle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "responseType" TEXT,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "publicId" TEXT NOT NULL,
    "webhookHandleId" TEXT,
    CONSTRAINT "PolyFunction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PolyFunction_webhookHandleId_fkey" FOREIGN KEY ("webhookHandleId") REFERENCES "WebhookHandle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PolyFunction" ("alias", "body", "context", "headers", "id", "method", "payload", "publicId", "response", "responseType", "trained", "url", "userId") SELECT "alias", "body", "context", "headers", "id", "method", "payload", "publicId", "response", "responseType", "trained", "url", "userId" FROM "PolyFunction";
DROP TABLE "PolyFunction";
ALTER TABLE "new_PolyFunction" RENAME TO "PolyFunction";
CREATE UNIQUE INDEX "PolyFunction_webhookHandleId_key" ON "PolyFunction"("webhookHandleId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
