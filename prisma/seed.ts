import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

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

  // 3. Cursos y lecciones
  const coursesData = [
    {
      title: 'Introducción a la IA',
      description: 'Fundamentos de inteligencia artificial.',
      levelId: 1,
      isRequired: true,
      duration: '2h 30m',
      thumbnailUrl: 'https://picsum.photos/id/1/400/200',
      skillsTags: ['IA', 'Machine Learning'],
      isPublished: true,
      lessons: [
        { title: '¿Qué es la IA?', videoUrl: 'https://example.com/v1.mp4', content: 'Introducción...', displayOrder: 1, duration: '10m', isFreePreview: true },
        { title: 'Historia de la IA', videoUrl: 'https://example.com/v2.mp4', content: 'Evolución...', displayOrder: 2, duration: '15m', isFreePreview: false },
      ],
    },
    {
      title: 'Python para Data Science',
      description: 'Pandas, NumPy y visualización.',
      levelId: 2,
      isRequired: false,
      duration: '4h',
      thumbnailUrl: 'https://picsum.photos/id/0/400/200',
      skillsTags: ['Python', 'Data Science'],
      isPublished: true,
      lessons: [
        { title: 'Introducción a Python', videoUrl: 'https://example.com/py1.mp4', content: 'Sintaxis básica', displayOrder: 1, duration: '20m', isFreePreview: true },
      ],
    },
    {
      title: 'Redes Neuronales con TensorFlow',
      description: 'Construye y entrena modelos.',
      levelId: 3,
      isRequired: true,
      duration: '6h',
      thumbnailUrl: 'https://picsum.photos/id/26/400/200',
      skillsTags: ['TensorFlow', 'Deep Learning'],
      isPublished: true,
      lessons: [],
    },
  ];

  for (const courseData of coursesData) {
    // Buscar curso por título
    let course = await prisma.course.findFirst({ where: { title: courseData.title } });
    if (!course) {
      course = await prisma.course.create({
        data: {
          title: courseData.title,
          description: courseData.description,
          levelId: courseData.levelId,
          isRequired: courseData.isRequired,
          duration: courseData.duration,
          thumbnailUrl: courseData.thumbnailUrl,
          skillsTags: courseData.skillsTags,
          isPublished: courseData.isPublished,
        },
      });
    } else {
      // Actualizar si existe (opcional)
      course = await prisma.course.update({
        where: { id: course.id },
        data: {
          description: courseData.description,
          levelId: courseData.levelId,
          isRequired: courseData.isRequired,
          duration: courseData.duration,
          thumbnailUrl: courseData.thumbnailUrl,
          skillsTags: courseData.skillsTags,
          isPublished: courseData.isPublished,
        },
      });
    }

    // Crear lecciones faltantes
    for (const lessonData of courseData.lessons) {
      const existingLesson = await prisma.lesson.findFirst({
        where: { title: lessonData.title, courseId: course.id },
      });
      if (!existingLesson) {
        await prisma.lesson.create({
          data: { ...lessonData, courseId: course.id },
        });
      }
    }
    console.log(`✅ Curso: "${course.title}" procesado con ${courseData.lessons.length} lecciones`);
  }

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