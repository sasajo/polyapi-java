-- AlterTable
ALTER TABLE "url_function" ADD COLUMN "arguments_metadata" TEXT;
ALTER TABLE "url_function" DROP COLUMN "argument_types";
