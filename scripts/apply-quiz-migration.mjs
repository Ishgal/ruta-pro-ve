import { createRequire } from 'module'
const require = createRequire(import.meta.url)
require('dotenv').config()

import { PrismaClient } from '../app/generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Aplicando migracion user_quiz_results...')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "user_quiz_results" (
      "user_id" UUID NOT NULL,
      "lesson_id" UUID NOT NULL,
      "answers" JSONB NOT NULL,
      "submitted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "user_quiz_results_pkey" PRIMARY KEY ("user_id","lesson_id")
    )
  `)
  console.log('Tabla creada.')

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_user_quiz_results_user_id" ON "user_quiz_results"("user_id")
  `)
  console.log('Indice creado.')

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_quiz_results_lesson_id_fkey'
      ) THEN
        ALTER TABLE "user_quiz_results" ADD CONSTRAINT "user_quiz_results_lesson_id_fkey"
          FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_quiz_results_user_id_fkey'
      ) THEN
        ALTER TABLE "user_quiz_results" ADD CONSTRAINT "user_quiz_results_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)
  console.log('Foreign keys creadas.')
  console.log('Migracion completada.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
