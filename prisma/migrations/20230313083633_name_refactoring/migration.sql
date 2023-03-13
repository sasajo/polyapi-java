PRAGMA foreign_keys=off;
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "api_key" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER'
);
INSERT INTO "users" ("id", "api_key", "name", "role") SELECT "id", "apiKey", "name", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "users" RENAME TO "user";

CREATE TABLE "webhook_handle" (
                                "id" TEXT NOT NULL PRIMARY KEY,
                                "user_id" INTEGER NOT NULL,
                                "context" TEXT NOT NULL,
                                "alias" TEXT NOT NULL,
                                "event_payload" TEXT NOT NULL,
                                "event_type" TEXT NOT NULL,
                                CONSTRAINT "webhook_handle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "webhook_handle" ("id", "user_id", "context", "alias", "event_payload", "event_type") SELECT "id", "userId", "context", "alias", "eventPayload", "eventType" FROM "WebhookHandle";
DROP TABLE "WebhookHandle";

CREATE TABLE "url_function" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "payload" TEXT,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headers" TEXT,
    "body" TEXT,
    "response" TEXT,
    "response_type" TEXT,
    "argument_types" TEXT,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "public_id" TEXT NOT NULL,
    "webhook_handle_id" TEXT,
    CONSTRAINT "url_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "url_function_webhook_handle_id_fkey" FOREIGN KEY ("webhook_handle_id") REFERENCES "webhook_handle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "url_function" ("id", "user_id", "alias", "context", "payload", "method", "url", "headers", "body", "response", "response_type", "argument_types", "trained", "public_id", "webhook_handle_id") SELECT "id", "userId", "alias", "context", "payload", "method", "url", "headers", "body", "response", "responseType", "argumentTypes", "trained", "publicId", "webhookHandleId" FROM "PolyFunction";
DROP TABLE "PolyFunction";

CREATE UNIQUE INDEX "user_api_key_key" ON "user"("api_key");

CREATE UNIQUE INDEX "url_function_public_id_key" ON "url_function"("public_id");

CREATE UNIQUE INDEX "url_function_webhook_handle_id_key" ON "url_function"("webhook_handle_id");
PRAGMA foreign_keys=on;
