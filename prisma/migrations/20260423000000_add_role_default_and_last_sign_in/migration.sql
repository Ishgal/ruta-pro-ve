-- Add DEFAULT 'estudiante' to role column
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'estudiante'::"Role";

-- Add last_sign_in_at column
ALTER TABLE "users" ADD COLUMN "last_sign_in_at" TIMESTAMP;
