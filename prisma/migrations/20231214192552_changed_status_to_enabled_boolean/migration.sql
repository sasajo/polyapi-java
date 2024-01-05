/*
  Warnings:

  - You are about to drop the column `status` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "job" DROP COLUMN "status",
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true;
