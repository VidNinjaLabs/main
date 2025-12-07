/*
  Warnings:

  - You are about to drop the column `device` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `namespace` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profile` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropIndex
DROP INDEX "users_publicKey_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "device",
DROP COLUMN "namespace",
DROP COLUMN "profile",
DROP COLUMN "publicKey",
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL;

-- DropTable
DROP TABLE "sessions";
