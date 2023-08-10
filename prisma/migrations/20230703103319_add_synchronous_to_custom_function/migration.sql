-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_custom_function" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "environment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL,
    "arguments" TEXT NOT NULL,
    "return_type" TEXT,
    "synchronous" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "server_side" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'ENVIRONMENT',
    CONSTRAINT "custom_function_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_custom_function" ("arguments", "code", "context", "created_at", "description", "environment_id", "id", "name", "requirements", "return_type", "server_side", "trained", "visibility") SELECT "arguments", "code", "context", "created_at", "description", "environment_id", "id", "name", "requirements", "return_type", "server_side", "trained", "visibility" FROM "custom_function";
DROP TABLE "custom_function";
ALTER TABLE "new_custom_function" RENAME TO "custom_function";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
