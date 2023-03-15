-- CreateTable
CREATE TABLE "conversation_message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "conversation_message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "conversation_message" ("id", "user_id", "name", "created", "role", "content") SELECT "id", "user_id", "name", "created", "role", "content" FROM "ConversationMessage";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ConversationMessage";
PRAGMA foreign_keys=on;
