-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_custom_function" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL,
    "arguments" TEXT NOT NULL,
    "return_type" TEXT,
    "public_id" TEXT NOT NULL,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "server_side" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "custom_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_custom_function" ("arguments", "code", "context", "created_at", "description", "id", "name", "public_id", "return_type", "trained", "user_id", "server_side") SELECT "arguments", "code", "context", "created_at", "description", "id", "name", "public_id", "return_type", "trained", "user_id", FALSE FROM "custom_function";
DROP TABLE "custom_function";
ALTER TABLE "new_custom_function" RENAME TO "custom_function";
CREATE UNIQUE INDEX "custom_function_public_id_key" ON "custom_function"("public_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
