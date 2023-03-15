-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webhook_handle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_payload" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    CONSTRAINT "webhook_handle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_webhook_handle" ("context", "event_payload", "event_type", "id", "name", "user_id", "created_at") SELECT "context", "event_payload", "event_type", "id", "name", "user_id", cast(strftime('%s','now') as int) * 1000 FROM "webhook_handle";
DROP TABLE "webhook_handle";
ALTER TABLE "new_webhook_handle" RENAME TO "webhook_handle";
CREATE TABLE "new_url_function" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "payload" TEXT,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headers" TEXT,
    "body" TEXT,
    "auth" TEXT,
    "response" TEXT,
    "response_type" TEXT,
    "argument_types" TEXT,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "public_id" TEXT NOT NULL,
    "webhook_handle_id" TEXT,
    CONSTRAINT "url_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "url_function_webhook_handle_id_fkey" FOREIGN KEY ("webhook_handle_id") REFERENCES "webhook_handle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_url_function" ("argument_types", "auth", "body", "context", "description", "headers", "id", "method", "name", "payload", "public_id", "response", "response_type", "trained", "url", "user_id", "webhook_handle_id", "created_at") SELECT "argument_types", "auth", "body", "context", "description", "headers", "id", "method", "name", "payload", "public_id", "response", "response_type", "trained", "url", "user_id", "webhook_handle_id", cast(strftime('%s','now') as int) * 1000 FROM "url_function";
DROP TABLE "url_function";
ALTER TABLE "new_url_function" RENAME TO "url_function";
CREATE UNIQUE INDEX "url_function_public_id_key" ON "url_function"("public_id");
CREATE UNIQUE INDEX "url_function_webhook_handle_id_key" ON "url_function"("webhook_handle_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
