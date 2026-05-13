-- CreateTable
CREATE TABLE "user_quiz_results" (
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quiz_results_pkey" PRIMARY KEY ("user_id","lesson_id")
);

-- CreateIndex
CREATE INDEX "idx_user_quiz_results_user_id" ON "user_quiz_results"("user_id");

-- AddForeignKey
ALTER TABLE "user_quiz_results" ADD CONSTRAINT "user_quiz_results_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_results" ADD CONSTRAINT "user_quiz_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
