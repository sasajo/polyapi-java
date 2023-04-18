-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_function" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "auth_url" TEXT NOT NULL,
    "access_token_url" TEXT NOT NULL,
    "revoke_url" TEXT,
    "public_id" TEXT NOT NULL,
    "audience_required" BOOLEAN NOT NULL DEFAULT false,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "auth_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_auth_function" ("access_token_url", "auth_url", "context", "created_at", "description", "id", "name", "public_id", "trained", "user_id") SELECT "access_token_url", "auth_url", "context", "created_at", "description", "id", "name", "public_id", "trained", "user_id" FROM "auth_function";
DROP TABLE "auth_function";
ALTER TABLE "new_auth_function" RENAME TO "auth_function";
CREATE UNIQUE INDEX "auth_function_public_id_key" ON "auth_function"("public_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
