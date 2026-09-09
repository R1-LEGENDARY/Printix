/*
  Warnings:

  - A unique constraint covering the columns `[printable_area_id,variant_id]` on the table `product_mockup_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "product_mockup_templates" ADD COLUMN     "variant_id" BIGINT;

-- CreateIndex
CREATE INDEX "product_mockup_templates_variant_id_idx" ON "product_mockup_templates"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_mockup_templates_printable_area_id_variant_id_key" ON "product_mockup_templates"("printable_area_id", "variant_id");

-- AddForeignKey
ALTER TABLE "product_mockup_templates" ADD CONSTRAINT "product_mockup_templates_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
