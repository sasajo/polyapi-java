/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `config_variable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "config_variable_name_key" ON "config_variable"("name");
