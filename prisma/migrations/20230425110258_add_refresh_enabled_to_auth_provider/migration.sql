-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "authorize_url" TEXT NOT NULL,
    "token_url" TEXT NOT NULL,
    "revoke_url" TEXT,
    "introspect_url" TEXT,
    "audience_required" BOOLEAN NOT NULL DEFAULT false,
    "refresh_enabled" BOOLEAN NOT NULL DEFAULT false,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "auth_provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_auth_provider" ("audience_required", "authorize_url", "context", "created_at", "id", "introspect_url", "revoke_url", "token_url", "trained", "user_id") SELECT "audience_required", "authorize_url", "context", "created_at", "id", "introspect_url", "revoke_url", "token_url", "trained", "user_id" FROM "auth_provider";
DROP TABLE "auth_provider";
ALTER TABLE "new_auth_provider" RENAME TO "auth_provider";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
