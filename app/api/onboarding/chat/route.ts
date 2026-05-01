import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateContent } from '@/lib/ai'

interface ChatMessage { role: 'user' | 'ai'; text: string }

interface ProfileData {
  educationLevel: string
  career: string
  university?: string
  academicYear?: string
  hasWorkExperience: boolean | null
  workExperienceYears?: string
  jobRole?: string
  employmentStatus: string
  primaryGoal: string
  timeline: string
  declaredStrengths: { skill: string; level: string }[]
  weeklyHours: string
  location: string
  workModality: string
}

const CAREER_LABELS: Record<string, string> = {
  contaduria: 'Contaduría Pública',
  sistemas: 'Ingeniería de Sistemas',
}

const GOAL_LABELS: Record<string, string> = {
  primer_empleo: 'conseguir su primer empleo',
  crecer: 'crecer en su empleo actual',
  cambiar_area: 'cambiar de área o especialización',
  freelance: 'trabajar como freelance',
  emprender: 'emprender su propio negocio',
}

const TIMELINE_LABELS: Record<string, string> = {
  urgente: 'lo antes posible (1-3 meses)',
  seis_meses: 'en los próximos 6 meses',
  un_año: 'en el próximo año',
  sin_prisa: 'sin prisa, a su propio ritmo',
}

const HOURS_LABELS: Record<string, string> = {
  uno_a_tres: '1 a 3 horas por semana',
  tres_a_cinco: '3 a 5 horas por semana',
  cinco_a_diez: '5 a 10 horas por semana',
  diez_mas: 'más de 10 horas por semana',
}

type CourseForPrompt = {
  id: string
  title: string
  levelId: number
  description: string | null
  skillsTags: string[]
  careers: string[]
}

function buildSystemPrompt(firstName: string, profile: ProfileData, courses: CourseForPrompt[]) {
  const strengths = profile.declaredStrengths.length > 0
    ? profile.declaredStrengths.map(s => `${s.skill} (${s.level})`).join(', ')
    : 'ninguna declarada aún'

  const expLine = profile.hasWorkExperience
    ? `Tiene experiencia laboral (${profile.workExperienceYears ?? '?'} años)${profile.jobRole ? ` como ${profile.jobRole}` : ''}.`
    : 'No tiene experiencia laboral previa.'

  const courseList = courses
    .map(c => `  - ID:${c.id} | "${c.title}" | Nivel ${c.levelId} | Tags: ${c.skillsTags.join(', ')}`)
    .join('\n')

  return `Eres Valeria, coach de carrera de Ruta Pro-VE, una plataforma EdTech venezolana que conecta a jóvenes con el mercado laboral. Tu trabajo es hacer una entrevista breve y amigable al estudiante para entender en profundidad sus metas, contexto y brechas — y luego generar una ruta de aprendizaje personalizada.

## Perfil del estudiante (del formulario de registro)
- Nombre: ${firstName}
- Carrera: ${CAREER_LABELS[profile.career] ?? profile.career}
- Nivel educativo: ${profile.educationLevel}
- Situación laboral: ${profile.employmentStatus}
- ${expLine}
- Objetivo principal: ${GOAL_LABELS[profile.primaryGoal] ?? profile.primaryGoal}
- Plazo: ${TIMELINE_LABELS[profile.timeline] ?? profile.timeline}
- Disponibilidad: ${HOURS_LABELS[profile.weeklyHours] ?? profile.weeklyHours}
- Ubicación: ${profile.location}
- Fortalezas declaradas: ${strengths}

## Catálogo de cursos disponibles
${courseList}

## Tu comportamiento en la entrevista
1. Haz UNA sola pregunta a la vez. Sé conversacional, cálida y empática — habla como una persona real, no como un bot.
2. Construye sobre las respuestas anteriores. No repitas lo que el estudiante ya mencionó.
3. Profundiza en: aspiraciones concretas, áreas en las que se siente más inseguro, contexto inmediato (¿está aplicando a empleos? ¿tiene algún examen pronto? ¿ya sabe qué empresa quiere?).
4. Después de 3 a 5 intercambios, cuando tengas suficiente contexto para armar una ruta sólida, responde ÚNICAMENTE con este JSON (sin ningún texto adicional antes ni después):

{
  "type": "route_ready",
  "summary": "Resumen de 2-3 oraciones del perfil del estudiante y por qué esta ruta le viene bien",
  "assignedStartLevel": 1,
  "route": [
    { "courseId": "ID_REAL_DEL_CURSO", "title": "Título del curso", "reason": "Razón personalizada que referencia algo que dijo el estudiante", "order": 1 },
    ...
  ]
}

## Reglas para armar la ruta
- Para principiantes o recién graduados sin experiencia: assignedStartLevel = 1
- Para estudiantes con 2+ años de experiencia relevante: assignedStartLevel = 2
- Incluye entre 4 y 8 cursos en la ruta
- Prioriza los cursos que resuelven sus brechas y se alinean con su objetivo
- El campo "reason" debe ser personalizado — menciona algo concreto que dijo el estudiante
- USA SOLAMENTE cursos del catálogo provisto (con sus IDs exactos)
- No incluyas cursos de una carrera diferente a la del estudiante

## Idioma y tono
Siempre en español venezolano. Cálida, alentadora, directa — como una mentora que se preocupa de verdad.

Cuando recibas "[INICIO_ENTREVISTA]", preséntate brevemente (2 líneas máximo) y haz tu primera pregunta.

## REGLA CRÍTICA — ENTREGA DE LA RUTA
Cuando ya tengas suficiente información (3-5 intercambios), tu ÚNICO mensaje de respuesta debe ser el bloque JSON. Sin introducción. Sin frase de cierre. Sin explicaciones. Sin "aquí está tu ruta". SOLO el JSON en crudo, empezando exactamente con { y terminando exactamente con }. Nada antes. Nada después.`
}

// Finds the first valid JSON object with type:"route_ready" anywhere in the text,
// even when the model wraps it in conversational prose.
function extractRouteReady(text: string): Record<string, unknown> | null {
  if (!text.includes('route_ready')) return null
  let i = 0
  while (i < text.length) {
    const start = text.indexOf('{', i)
    if (start === -1) break
    let depth = 0
    let inStr = false
    let esc = false
    let end = -1
    for (let j = start; j < text.length; j++) {
      const c = text[j]
      if (esc) { esc = false; continue }
      if (c === '\\' && inStr) { esc = true; continue }
      if (c === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) { end = j; break }
      }
    }
    if (end !== -1) {
      try {
        const obj = JSON.parse(text.slice(start, end + 1))
        if (obj?.type === 'route_ready' && Array.isArray(obj.route)) return obj
      } catch { /* not valid JSON */ }
    }
    i = start + 1
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } })
  const firstName = dbUser?.name?.split(' ')[0] ?? 'estudiante'

  const body = await request.json()
  const { messages, profileData }: { messages: ChatMessage[]; profileData: ProfileData } = body

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, levelId: true, description: true, skillsTags: true, careers: true },
    orderBy: [{ levelId: 'asc' }, { createdAt: 'asc' }],
  })

  const systemInstruction = buildSystemPrompt(firstName, profileData, courses)

  // Gemini requires contents to start with 'user' role.
  // When messages is empty (first call), send the trigger phrase.
  const geminiMessages: { role: 'user' | 'model'; text: string }[] = [
    { role: 'user', text: '[INICIO_ENTREVISTA]' },
    ...messages.map(m => ({
      role: (m.role === 'ai' ? 'model' : 'user') as 'user' | 'model',
      text: m.text,
    })),
  ]

  let reply: string
  try {
    reply = await generateContent({ systemInstruction, messages: geminiMessages })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[onboarding/chat] Gemini error:', msg)
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return NextResponse.json({ routeReady: false, reply: 'Estoy procesando muchas solicitudes en este momento. Espera unos segundos e intenta de nuevo.' }, { status: 200 })
    }
    return NextResponse.json({ error: 'Error al conectar con la IA', detail: msg }, { status: 500 })
  }

  // Robust extraction: find any valid JSON object containing "type":"route_ready"
  // even if the model wrapped it in conversational text
  const routeData = extractRouteReady(reply)
  if (routeData) {
    return NextResponse.json({ routeReady: true, routeData })
  }

  return NextResponse.json({ routeReady: false, reply: reply.trim() })
}
