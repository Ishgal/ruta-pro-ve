import { PrismaClient } from '../app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Niveles (1 a 5)
  const levelsData = [
    { id: 1, displayOrder: 1, name: 'Nivel 1', description: 'Fundamentos' },
    { id: 2, displayOrder: 2, name: 'Nivel 2', description: 'Intermedio básico' },
    { id: 3, displayOrder: 3, name: 'Nivel 3', description: 'Intermedio avanzado' },
    { id: 4, displayOrder: 4, name: 'Nivel 4', description: 'Avanzado' },
    { id: 5, displayOrder: 5, name: 'Nivel 5', description: 'Experto' },
  ];
  for (const level of levelsData) {
    const existing = await prisma.level.findUnique({ where: { id: level.id } });
    if (!existing) {
      await prisma.level.create({ data: level });
    } else {
      await prisma.level.update({ where: { id: level.id }, data: level });
    }
  }
  console.log('✅ Niveles 1-5 creados');

  // 2. Badges
  const badgesData = [
    {
      name: 'Explorador',
      description: 'Completa 1 curso',
      conditionType: 'COURSE_COMPLETION',
      conditionValue: 1,
      iconUrl: '/icons/explorador.png',
    },
    {
      name: 'Curioso',
      description: 'Completa 3 cursos',
      conditionType: 'COURSE_COMPLETION',
      conditionValue: 3,
      iconUrl: '/icons/curioso.png',
    },
  ];
  for (const badgeData of badgesData) {
    const existing = await prisma.badge.findFirst({ where: { name: badgeData.name } });
    if (!existing) {
      await prisma.badge.create({ data: badgeData });
    } else {
      await prisma.badge.update({ where: { id: existing.id }, data: badgeData });
    }
  }
  console.log('✅ Badges creados');

  // 3. Cursos (Asegurar que existan para las lecciones del SQL)
  const coursesData = [
    // Cursos originales del seed.ts
    { title: 'Introducción a la IA', levelId: 1, isPublished: true, duration: '2h 30m' },
    { title: 'Python para Data Science', levelId: 2, isPublished: true, duration: '4h' },
    { title: 'Redes Neuronales con TensorFlow', levelId: 3, isPublished: true, duration: '6h' },
    // Cursos requeridos por lessons_seed.sql
    { title: 'Fundamentos de Contabilidad Venezolana', levelId: 1, isPublished: true, duration: '2h' },
    { title: 'Lógica de Programación', levelId: 1, isPublished: true, duration: '2h' },
    { title: 'Análisis de Estados Financieros', levelId: 2, isPublished: true, duration: '3h' },
    { title: 'Desarrollo Web: HTML, CSS y JavaScript', levelId: 2, isPublished: true, duration: '4h' },
    { title: 'Declaraciones de ISLR e IVA en Venezuela', levelId: 3, isPublished: true, duration: '3h' },
    { title: 'Control de Versiones con Git y GitHub', levelId: 3, isPublished: true, duration: '2h' },
    { title: 'Auditoría Financiera', levelId: 4, isPublished: true, duration: '4h' },
    { title: 'Arquitectura de Software', levelId: 4, isPublished: true, duration: '4h' },
  ];

  for (const courseData of coursesData) {
    const existing = await prisma.course.findFirst({ where: { title: courseData.title } });
    if (!existing) {
      await prisma.course.create({
        data: {
          title: courseData.title,
          levelId: courseData.levelId,
          isPublished: courseData.isPublished,
          duration: courseData.duration,
          description: courseData.title, // Placeholder
        },
      });
    }
  }
  console.log('✅ Cursos base creados');

  // 4. Ejecutar el SQL de lecciones
  console.log('📖 Cargando lecciones detalladas desde SQL...');
  try {
    const sqlPath = path.join(__dirname, 'seeds', 'lessons_seed.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    // Limpiar lecciones previas para evitar duplicados si el SQL usa INSERT
    // (Solo si estamos seguros de querer repoblar todo)
    await prisma.$executeRawUnsafe('TRUNCATE TABLE lessons CASCADE');
    
    // Ejecutar el SQL completo
    await prisma.$executeRawUnsafe(sqlContent);
    console.log('✅ Lecciones cargadas exitosamente desde SQL');
  } catch (error) {
    console.warn('⚠️ No se pudo cargar lessons_seed.sql automáticamente:', error);
    console.log('ℹ️ Puedes cargarlo manualmente en el SQL Editor de Supabase.');
  }

  // 5. AppSettings (precios y parámetros globales)
  const settingsData = [
    { key: 'plan_price_plata',      value: '5.00',  label: 'Precio plan Plata (USD)' },
    { key: 'plan_price_oro',        value: '10.00', label: 'Precio plan Oro (USD)' },
    { key: 'plan_discount_pct_plata', value: '50',  label: 'Descuento cupón Plata (%)' },
    { key: 'plan_discount_pct_oro', value: '30',    label: 'Descuento cupón Oro (%)' },
    { key: 'plan_coupons_plata',    value: '1',     label: 'Cupones mensuales Plata' },
    { key: 'plan_coupons_oro',      value: '2',     label: 'Cupones mensuales Oro' },
    { key: 'certificate_price',     value: '5.00',  label: 'Precio certificado (USD)' },
    { key: 'course_extra_price',    value: '3.00',  label: 'Precio curso extra (USD)' },
  ];
  for (const s of settingsData) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { label: s.label },
      create: s,
    });
  }
  console.log('✅ AppSettings creados');

  console.log('🎉 Seeding completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });