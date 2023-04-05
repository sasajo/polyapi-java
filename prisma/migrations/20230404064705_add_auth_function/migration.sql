-- CreateTable
CREATE TABLE "auth_function" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "auth_url" TEXT NOT NULL,
    "access_token_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "trained" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "auth_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auth_token" (
    "auth_function_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "state" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "events_client_id" TEXT,

    PRIMARY KEY ("auth_function_id", "user_id"),
    CONSTRAINT "auth_token_auth_function_id_fkey" FOREIGN KEY ("auth_function_id") REFERENCES "auth_function" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auth_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_function_public_id_key" ON "auth_function"("public_id");
