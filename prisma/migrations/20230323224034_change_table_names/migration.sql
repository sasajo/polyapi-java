/*
  Warnings:

  - You are about to drop the `FunctionDefined` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookDefined` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FunctionDefined";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WebhookDefined";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "function_defined" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" TEXT NOT NULL,
    "functionPublicId" TEXT NOT NULL,
    CONSTRAINT "function_defined_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "conversation_message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_defined" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" TEXT NOT NULL,
    "webhookPublicId" TEXT NOT NULL,
    CONSTRAINT "webhook_defined_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "conversation_message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
