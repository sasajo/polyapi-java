-- CreateTable
CREATE TABLE "custom_function" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "context" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "arguments" TEXT NOT NULL,
    "return_type" TEXT,
    "public_id" TEXT NOT NULL,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "custom_function_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_function_public_id_key" ON "custom_function"("public_id");
