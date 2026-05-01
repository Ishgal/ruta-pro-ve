import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'development' | 'exercise'

export interface ExamQuestion {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer?: string
  points: number
  rubric?: string
}

export interface ExamData {
  courseId: string
  courseTitle: string
  questions: ExamQuestion[]
  totalPoints: number
  passingScore: number
  generatedAt: string
}

async function generateWithGroq(courseTitle: string, lessonTitles: string[]): Promise<ExamQuestion[]> {
  const context = lessonTitles.length > 0
    ? `Lecciones del curso: ${lessonTitles.join(', ')}`
    : courseTitle

  const prompt = `Eres un profesor experto en "${courseTitle}". Genera un examen final con EXACTAMENTE 8 preguntas basadas en: ${context}

Responde ÚNICAMENTE con un array JSON válido, sin markdown, sin bloques de código:
[
  {"id":"q1","type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":"A. ...","points":10,"rubric":null},
  {"id":"q2","type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":"B. ...","points":10,"rubric":null},
  {"id":"q3","type":"multiple_choice","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":"C. ...","points":10,"rubric":null},
  {"id":"q4","type":"true_false","question":"...","options":["Verdadero","Falso"],"correctAnswer":"Verdadero","points":5,"rubric":null},
  {"id":"q5","type":"true_false","question":"...","options":["Verdadero","Falso"],"correctAnswer":"Falso","points":5,"rubric":null},
  {"id":"q6","type":"development","question":"...","options":null,"correctAnswer":null,"points":20,"rubric":"Evalua si el estudiante: (1) define correctamente el concepto, (2) da al menos un ejemplo real, (3) explica la importancia practica."},
  {"id":"q7","type":"fill_blank","question":"Completa: '_____ es ...'","options":null,"correctAnswer":"...","points":10,"rubric":null},
  {"id":"q8","type":"exercise","question":"...","options":null,"correctAnswer":null,"points":30,"rubric":"Evalua: (1) identificacion del problema, (2) aplicacion del procedimiento correcto, (3) resultado correcto o razonamiento claro."}
]`

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error: ${err}`)
  }

  const data = await res.json()
  const raw = (data.choices[0]?.message?.content as string ?? '').trim()
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned) as ExamQuestion[]
}

function generateStaticExam(courseTitle: string, lessonTitles: string[]): ExamQuestion[] {
  const lessons = lessonTitles.length > 0 ? lessonTitles : [`los conceptos de ${courseTitle}`]
  const l = (i: number) => lessons[i % lessons.length]

  return [
    {
      id: 'q1', type: 'multiple_choice', points: 10,
      question: `¿Cuál es el objetivo principal de "${l(0)}" dentro del contexto de ${courseTitle}?`,
      options: [
        'A. Conocer los fundamentos teoricos basicos',
        'B. Aplicar procedimientos en situaciones practicas reales',
        'C. Memorizar definiciones sin contexto',
        'D. Evitar el analisis critico de la informacion',
      ],
      correctAnswer: 'B. Aplicar procedimientos en situaciones practicas reales',
      rubric: undefined,
    },
    {
      id: 'q2', type: 'multiple_choice', points: 10,
      question: `En el tema "${l(1)}", ¿qué enfoque es más adecuado para un profesional?`,
      options: [
        'A. Ignorar los antecedentes del tema',
        'B. Integrar el conocimiento con la experiencia practica',
        'C. Depender exclusivamente de la memoria',
        'D. Evitar la aplicacion en casos reales',
      ],
      correctAnswer: 'B. Integrar el conocimiento con la experiencia practica',
      rubric: undefined,
    },
    {
      id: 'q3', type: 'multiple_choice', points: 10,
      question: `¿Cuál de las siguientes afirmaciones describe mejor lo aprendido en "${l(2)}"?`,
      options: [
        'A. Los conceptos no tienen aplicacion practica',
        'B. Solo es relevante en contextos academicos',
        'C. Permite tomar decisiones informadas en el campo profesional',
        'D. Se puede omitir sin afectar el resultado final',
      ],
      correctAnswer: 'C. Permite tomar decisiones informadas en el campo profesional',
      rubric: undefined,
    },
    {
      id: 'q4', type: 'true_false', points: 5,
      question: `La aplicacion correcta de los conceptos de "${l(0)}" mejora la eficiencia en el trabajo profesional.`,
      options: ['Verdadero', 'Falso'],
      correctAnswer: 'Verdadero',
      rubric: undefined,
    },
    {
      id: 'q5', type: 'true_false', points: 5,
      question: `Es suficiente con memorizar definiciones de "${l(1)}" sin entender su aplicacion practica.`,
      options: ['Verdadero', 'Falso'],
      correctAnswer: 'Falso',
      rubric: undefined,
    },
    {
      id: 'q6', type: 'development', points: 20,
      question: `Explica con tus propias palabras la importancia de "${l(0)}" en el contexto de ${courseTitle}. Incluye al menos un ejemplo practico.`,
      options: undefined,
      correctAnswer: undefined,
      rubric: `Evalua si el estudiante: (1) explica el concepto correctamente con sus propias palabras (5pts), (2) justifica su importancia en el campo profesional (5pts), (3) proporciona un ejemplo practico relevante (10pts). Maximo 20 puntos.`,
    },
    {
      id: 'q7', type: 'fill_blank', points: 10,
      question: `Completa: "El proceso de ${courseTitle} requiere _____ para lograr resultados optimos en el ambito profesional."`,
      options: undefined,
      correctAnswer: 'conocimiento y practica',
      rubric: undefined,
    },
    {
      id: 'q8', type: 'exercise', points: 30,
      question: `Describe como aplicarias lo aprendido en "${l(lessons.length - 1)}" para resolver un problema real en tu area profesional. Detalla los pasos que seguirias y justifica cada decision.`,
      options: undefined,
      correctAnswer: undefined,
      rubric: `Evalua: (1) identificacion correcta del problema o escenario (10pts), (2) aplicacion coherente de los conceptos del curso (10pts), (3) justificacion clara de las decisiones tomadas (10pts). Maximo 30 puntos.`,
    },
  ]
}

// POST /api/courses/[courseId]/exam
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { courseId } = await params

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      lessons: { select: { title: true }, orderBy: { displayOrder: 'asc' } },
    },
  })
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const lessonTitles = course.lessons.map(l => l.title)

  let questions: ExamQuestion[]
  try {
    questions = await generateWithGroq(course.title, lessonTitles)
  } catch {
    // AI unavailable — use static generator so the feature always works
    questions = generateStaticExam(course.title, lessonTitles)
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const examData: ExamData = {
    courseId,
    courseTitle: course.title,
    questions,
    totalPoints,
    passingScore: 70,
    generatedAt: new Date().toISOString(),
  }

  const attempt = await prisma.examAttempt.create({
    data: {
      courseId,
      userId: user.id,
      examData: examData as object,
      passed: false,
    },
    select: { id: true, examData: true, startedAt: true },
  })

  return NextResponse.json(attempt)
}

// GET /api/courses/[courseId]/exam
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { courseId } = await params

  const attempt = await prisma.examAttempt.findFirst({
    where: { courseId, userId: user.id, passed: true },
    orderBy: { completedAt: 'desc' },
    select: { id: true, score: true, passed: true, completedAt: true },
  })

  return NextResponse.json({ attempt })
}
