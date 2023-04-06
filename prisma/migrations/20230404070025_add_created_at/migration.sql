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
    "public_id" TEXT NOT NULL,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "auth_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_auth_function" ("access_token_url", "auth_url", "context", "description", "id", "name", "public_id", "trained", "user_id", "created_at") SELECT "access_token_url", "auth_url", "context", "description", "id", "name", "public_id", "trained", "user_id", cast(strftime('%s','now') as int) * 1000 FROM "auth_function";
DROP TABLE "auth_function";
ALTER TABLE "new_auth_function" RENAME TO "auth_function";
CREATE UNIQUE INDEX "auth_function_public_id_key" ON "auth_function"("public_id");
CREATE TABLE "new_auth_token" (
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auth_function_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "state" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "events_client_id" TEXT,

    PRIMARY KEY ("auth_function_id", "user_id"),
    CONSTRAINT "auth_token_auth_function_id_fkey" FOREIGN KEY ("auth_function_id") REFERENCES "auth_function" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auth_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_auth_token" ("access_token", "auth_function_id", "refresh_token", "user_id", "created_at", "client_id", "client_secret") SELECT "access_token", "auth_function_id", "refresh_token", "user_id", cast(strftime('%s','now') as int) * 1000, '', '' FROM "auth_token";
DROP TABLE "auth_token";
ALTER TABLE "new_auth_token" RENAME TO "auth_token";
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
    CONSTRAINT "custom_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_custom_function" ("arguments", "code", "context", "description", "id", "name", "public_id", "return_type", "trained", "user_id", "created_at") SELECT "arguments", "code", "context", "description", "id", "name", "public_id", "return_type", "trained", "user_id", cast(strftime('%s','now') as int) * 1000 FROM "custom_function";
DROP TABLE "custom_function";
ALTER TABLE "new_custom_function" RENAME TO "custom_function";
CREATE UNIQUE INDEX "custom_function_public_id_key" ON "custom_function"("public_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
