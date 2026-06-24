-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "guest_expires_at" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
