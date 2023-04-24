/*
  Warnings:

  - You are about to drop the `url_function` table. If the table is not empty, all the data it contains will be lost.

*/

-- CreateTable
CREATE TABLE "api_function" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL,
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
    "arguments_metadata" TEXT,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "public_id" TEXT NOT NULL,
    CONSTRAINT "api_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CopyTable
INSERT INTO "api_function" ("id", "created_at", "user_id", "name", "context", "description", "payload", "method", "url", "headers", "body", "auth", "response", "arguments_metadata", "trained", "public_id") SELECT "id", "created_at", "user_id", "name", "context", "description", "payload", "method", "url", "headers", "body", "auth", "response", "arguments_metadata", "trained", "public_id" FROM "url_function";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "url_function";
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE UNIQUE INDEX "api_function_public_id_key" ON "api_function"("public_id");
