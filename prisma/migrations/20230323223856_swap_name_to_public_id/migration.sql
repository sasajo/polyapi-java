/*
  Warnings:

  - You are about to drop the column `function_id` on the `FunctionDefined` table. All the data in the column will be lost.
  - You are about to drop the column `webhook_id` on the `WebhookDefined` table. All the data in the column will be lost.
  - Added the required column `functionPublicId` to the `FunctionDefined` table without a default value. This is not possible if the table is not empty.
  - Added the required column `webhookPublicId` to the `WebhookDefined` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FunctionDefined" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" TEXT NOT NULL,
    "functionPublicId" TEXT NOT NULL,
    CONSTRAINT "FunctionDefined_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "conversation_message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FunctionDefined" ("id", "message_id") SELECT "id", "message_id" FROM "FunctionDefined";
DROP TABLE "FunctionDefined";
ALTER TABLE "new_FunctionDefined" RENAME TO "FunctionDefined";
CREATE TABLE "new_WebhookDefined" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" TEXT NOT NULL,
    "webhookPublicId" TEXT NOT NULL,
    CONSTRAINT "WebhookDefined_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "conversation_message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WebhookDefined" ("id", "message_id") SELECT "id", "message_id" FROM "WebhookDefined";
DROP TABLE "WebhookDefined";
ALTER TABLE "new_WebhookDefined" RENAME TO "WebhookDefined";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
