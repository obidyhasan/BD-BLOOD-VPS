-- AlterTable
ALTER TABLE "postComments" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "postComments_parentId_idx" ON "postComments"("parentId");

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
