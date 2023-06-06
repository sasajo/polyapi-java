/*
  Warnings:

  - The primary key for the `auth_token` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `auth_token` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auth_function_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "audience" TEXT,
    "scopes" TEXT NOT NULL,
    "callback_url" TEXT,
    "state" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "events_client_id" TEXT,
    CONSTRAINT "auth_token_auth_function_id_fkey" FOREIGN KEY ("auth_function_id") REFERENCES "auth_function" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auth_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_auth_token" ("id", "access_token", "auth_function_id", "client_id", "client_secret", "scopes", "created_at", "events_client_id", "refresh_token", "state", "user_id") SELECT lower(hex(randomblob(16))), "access_token", "auth_function_id", "client_id", "client_secret", "", "created_at", "events_client_id", "refresh_token", "state", "user_id" FROM "auth_token";
DROP TABLE "auth_token";
ALTER TABLE "new_auth_token" RENAME TO "auth_token";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
