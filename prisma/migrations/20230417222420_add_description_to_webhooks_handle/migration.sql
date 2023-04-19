-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webhook_handle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_payload" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "webhook_handle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_webhook_handle" ("context", "created_at", "event_payload", "id", "name", "user_id") SELECT "context", "created_at", "event_payload", "id", "name", "user_id" FROM "webhook_handle";
DROP TABLE "webhook_handle";
ALTER TABLE "new_webhook_handle" RENAME TO "webhook_handle";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
