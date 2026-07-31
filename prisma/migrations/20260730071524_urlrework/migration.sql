/*
  Warnings:

  - You are about to drop the column `url` on the `Folder` table. All the data in the column will be lost.
  - Made the column `url` on table `File` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "File" ALTER COLUMN "url" SET NOT NULL;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "url";
