/*
  Warnings:

  - You are about to drop the column `access_token` on the `auth_token` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `auth_token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth_token" DROP COLUMN "access_token",
DROP COLUMN "refresh_token";
