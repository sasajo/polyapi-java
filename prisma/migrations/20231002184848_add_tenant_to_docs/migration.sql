-- AlterTable
ALTER TABLE "docsection" ADD COLUMN     "tenant_id" TEXT;

-- AddForeignKey
ALTER TABLE "docsection" ADD CONSTRAINT "docsection_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
