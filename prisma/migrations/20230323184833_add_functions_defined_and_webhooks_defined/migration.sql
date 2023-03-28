-- CreateTable
CREATE TABLE "FunctionDefined" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" TEXT NOT NULL,
    "function_id" INTEGER NOT NULL,
    CONSTRAINT "FunctionDefined_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "conversation_message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookDefined" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" TEXT NOT NULL,
    "webhook_id" TEXT NOT NULL,
    CONSTRAINT "WebhookDefined_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "conversation_message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
