/*
  Warnings:

  - You are about to drop the column `guest_expires_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "guest_expires_at";
