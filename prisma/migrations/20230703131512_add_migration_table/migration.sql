-- CreateTable
CREATE TABLE "migration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_name" TEXT NOT NULL
);
