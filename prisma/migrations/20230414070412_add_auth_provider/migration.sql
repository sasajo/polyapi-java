/*
  Warnings:

  - You are about to drop the `auth_function` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `auth_function_id` on the `auth_token` table. All the data in the column will be lost.
  - Added the required column `auth_provider_id` to the `auth_token` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "auth_function_public_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "auth_function";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "auth_provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "authorize_url" TEXT NOT NULL,
    "token_url" TEXT NOT NULL,
    "revoke_url" TEXT,
    "introspect_url" TEXT,
    "audience_required" BOOLEAN NOT NULL DEFAULT false,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "auth_provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auth_provider_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "callback_url" TEXT,
    "audience" TEXT,
    "scopes" TEXT NOT NULL,
    "state" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "events_client_id" TEXT,
    CONSTRAINT "auth_token_auth_provider_id_fkey" FOREIGN KEY ("auth_provider_id") REFERENCES "auth_provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auth_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
DROP TABLE "auth_token";
ALTER TABLE "new_auth_token" RENAME TO "auth_token";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
