-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "api_key" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "vip" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_user" ("api_key", "id", "name", "role") SELECT "api_key", "id", "name", "role" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_api_key_key" ON "user"("api_key");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
