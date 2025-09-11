/*
  Warnings:

  - A unique constraint covering the columns `[userId,categoryId,startDate,endDate]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_categoryId_startDate_endDate_key" ON "public"."Budget"("userId", "categoryId", "startDate", "endDate");
