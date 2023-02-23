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
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "publicId" TEXT NOT NULL,
    CONSTRAINT "PolyFunction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PolyFunction" ("alias", "body", "context", "headers", "id", "method", "payload", "publicId", "response", "url", "userId") SELECT "alias", "body", "context", "headers", "id", "method", "payload", "publicId", "response", "url", "userId" FROM "PolyFunction";
DROP TABLE "PolyFunction";
ALTER TABLE "new_PolyFunction" RENAME TO "PolyFunction";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
