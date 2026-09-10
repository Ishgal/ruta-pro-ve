-- ============================================================
-- Create missing tables that were created manually in Supabase
-- and were never tracked in a Prisma migration
-- ============================================================

-- CreateTable: teacher_messages (con Row Level Security)
CREATE TABLE IF NOT EXISTS "teacher_messages" (
    "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
    "teacher_id"      UUID        NOT NULL,
    "student_id"      UUID        NOT NULL,
    "course_id"       UUID,
    "content"         TEXT        NOT NULL,
    "is_read"         BOOLEAN     DEFAULT false,
    "created_at"      TIMESTAMPTZ DEFAULT now(),
    "updated_at"      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "teacher_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_teacher_messages_conversation"    ON "teacher_messages"("teacher_id", "student_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_teacher_messages_created_at"      ON "teacher_messages"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_teacher_messages_student_id"      ON "teacher_messages"("student_id");
CREATE INDEX IF NOT EXISTS "idx_teacher_messages_teacher_id"      ON "teacher_messages"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_teacher_messages_teacher_unread"  ON "teacher_messages"("teacher_id", "is_read") WHERE (is_read = false);

ALTER TABLE "teacher_messages"
    ADD CONSTRAINT "teacher_messages_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "teacher_messages"
    ADD CONSTRAINT "teacher_messages_teacher_id_fkey"
    FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddColumn: teachers.rating (needed by TeacherReview aggregation)
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "rating" FLOAT DEFAULT 0;

-- CreateTable: teacher_reviews
CREATE TABLE IF NOT EXISTS "teacher_reviews" (
    "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "teacher_id"  UUID        NOT NULL,
    "student_id"  UUID        NOT NULL,
    "course_id"   UUID        NOT NULL,
    "rating"      INTEGER     NOT NULL,
    "comment"     TEXT,
    "created_at"  TIMESTAMP(6) NOT NULL DEFAULT now(),
    CONSTRAINT "teacher_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "teacher_reviews_teacher_id_student_id_course_id_key"
        UNIQUE ("teacher_id", "student_id", "course_id")
);

CREATE INDEX IF NOT EXISTS "teacher_reviews_teacher_id_idx" ON "teacher_reviews"("teacher_id");

ALTER TABLE "teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_teacher_id_fkey"
    FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: mentor_assignments
CREATE TABLE IF NOT EXISTS "mentor_assignments" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "student_id"   UUID        NOT NULL,
    "teacher_id"   UUID        NOT NULL,
    "course_id"    UUID        NOT NULL,
    "status"       TEXT        NOT NULL DEFAULT 'active',
    "assigned_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "mentor_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mentor_assignments_student_id_course_id_key"
        UNIQUE ("student_id", "course_id")
);

CREATE INDEX IF NOT EXISTS "mentor_assignments_teacher_id_status_idx" ON "mentor_assignments"("teacher_id", "status");
CREATE INDEX IF NOT EXISTS "mentor_assignments_student_id_status_idx" ON "mentor_assignments"("student_id", "status");

ALTER TABLE "mentor_assignments"
    ADD CONSTRAINT "mentor_assignments_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mentor_assignments"
    ADD CONSTRAINT "mentor_assignments_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mentor_assignments"
    ADD CONSTRAINT "mentor_assignments_teacher_id_fkey"
    FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Original migration content
-- ============================================================

-- Add is_from_teacher column to teacher_messages
ALTER TABLE "teacher_messages" ADD COLUMN IF NOT EXISTS "is_from_teacher" BOOLEAN DEFAULT true;

-- Add extra_course_enrollment_id to payments
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "extra_course_enrollment_id" UUID;

-- Create extra_course_enrollments table
CREATE TABLE IF NOT EXISTS "extra_course_enrollments" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id"  UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "status"     TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'active', 'rejected')),
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now(),
  UNIQUE("user_id", "course_id")
);

CREATE INDEX IF NOT EXISTS "idx_extra_course_enrollments_user_id" ON "extra_course_enrollments"("user_id");

-- FK from payments to extra_course_enrollments
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_extra_course_enrollment_id_fkey"
  FOREIGN KEY ("extra_course_enrollment_id")
  REFERENCES "extra_course_enrollments"("id")
  ON DELETE SET NULL;
