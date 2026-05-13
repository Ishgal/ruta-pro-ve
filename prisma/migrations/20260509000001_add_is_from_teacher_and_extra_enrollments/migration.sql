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
