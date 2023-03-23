/*
  Warnings:

  - You are about to drop the column `created` on the `conversation_message` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "system_prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "system_prompt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversation_message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "conversation_message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_conversation_message" ("content", "id", "name", "role", "user_id") SELECT "content", "id", "name", "role", "user_id" FROM "conversation_message";
DROP TABLE "conversation_message";
ALTER TABLE "new_conversation_message" RENAME TO "conversation_message";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
