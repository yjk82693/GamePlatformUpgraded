-- AlterTable
ALTER TABLE "AchievementGroup" ADD COLUMN     "appId" TEXT;

-- AddForeignKey
ALTER TABLE "AchievementGroup" ADD CONSTRAINT "AchievementGroup_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE SET NULL ON UPDATE CASCADE;
