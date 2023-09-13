-- AlterTable
ALTER TABLE "webhook_handle" ADD COLUMN "response_headers" TEXT;
ALTER TABLE "webhook_handle" ADD COLUMN "response_payload" TEXT;
ALTER TABLE "webhook_handle" ADD COLUMN "response_status" INTEGER;
ALTER TABLE "webhook_handle" ADD COLUMN "subpath" TEXT;
ALTER TABLE "webhook_handle" ADD COLUMN "method" TEXT;
ALTER TABLE "webhook_handle" ADD COLUMN "security_function_ids" TEXT;
