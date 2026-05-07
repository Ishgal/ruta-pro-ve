/*
  Warnings:

  - You are about to drop the column `is_required` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `premium_until` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `subscription` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `medals` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SetupStatus" AS ENUM ('pending', 'active');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('bronce', 'plata', 'oro');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('video', 'article', 'quiz', 'slides');

-- DropForeignKey
ALTER TABLE "medals" DROP CONSTRAINT "medals_course_id_fkey";

-- DropForeignKey
ALTER TABLE "medals" DROP CONSTRAINT "medals_user_id_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "is_required",
ADD COLUMN     "careers" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "lesson_type" "LessonType" NOT NULL DEFAULT 'video',
ADD COLUMN     "quiz_data" JSONB,
ADD COLUMN     "slides_url" VARCHAR(500);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "expires_at",
ADD COLUMN     "amount_bs" DECIMAL(14,2),
ADD COLUMN     "certificate_id" UUID,
ADD COLUMN     "exchange_rate" DECIMAL(12,2),
ADD COLUMN     "original_amount" DECIMAL(10,2),
ADD COLUMN     "payment_date" TIMESTAMP(6),
ADD COLUMN     "subscription_id" UUID;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "premium_until",
DROP COLUMN "subscription",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plan" "PlanTier" NOT NULL DEFAULT 'bronce',
ADD COLUMN     "setup_status" "SetupStatus" NOT NULL DEFAULT 'active';

-- DropTable
DROP TABLE "medals";

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan" "PlanTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cert_discounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "discount_pct" INTEGER NOT NULL,
    "used_at" TIMESTAMP(6),
    "expires_at" TIMESTAMP(6) NOT NULL,
    "payment_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cert_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "user_id" UUID NOT NULL,
    "education_level" VARCHAR(50) NOT NULL,
    "career" VARCHAR(50) NOT NULL,
    "university" VARCHAR(255),
    "academic_year" VARCHAR(50),
    "graduation_year" INTEGER,
    "has_work_experience" BOOLEAN NOT NULL,
    "work_experience_years" INTEGER,
    "job_role" VARCHAR(255),
    "employment_status" VARCHAR(50) NOT NULL,
    "primary_goal" VARCHAR(50) NOT NULL,
    "timeline" VARCHAR(50) NOT NULL,
    "declared_strengths" JSONB NOT NULL DEFAULT '[]',
    "weekly_hours" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "work_modality" VARCHAR(50) NOT NULL,
    "cv_url" VARCHAR(500),
    "cv_analysis_notes" TEXT,
    "onboarding_chat" JSONB,
    "ai_profile_summary" TEXT,
    "knowledge_assessment" JSONB,
    "assigned_start_level" INTEGER NOT NULL DEFAULT 1,
    "completed_at" TIMESTAMP(6),
    "generated_route" JSONB,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "label" VARCHAR(255),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "payment_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "method" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "details" JSONB NOT NULL DEFAULT '{}',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("user_id","lesson_id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exam_data" JSONB NOT NULL,
    "answers" JSONB,
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cert_discounts_payment_id_key" ON "cert_discounts"("payment_id");

-- CreateIndex
CREATE INDEX "idx_user_lesson_progress_user_id" ON "user_lesson_progress"("user_id");

-- CreateIndex
CREATE INDEX "idx_exam_attempts_user_id" ON "exam_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_exam_attempts_course_user" ON "exam_attempts"("course_id", "user_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cert_discounts" ADD CONSTRAINT "cert_discounts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cert_discounts" ADD CONSTRAINT "cert_discounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
