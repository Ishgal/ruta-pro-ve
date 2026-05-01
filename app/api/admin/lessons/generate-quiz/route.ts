import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateContent } from '@/lib/ai'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { title, content } = await request.json()
  if (!title) return NextResponse.json({ error: 'Titulo requerido' }, { status: 400 })

  const contextBlock = content
    ? `\nContenido de referencia:\n${String(content).slice(0, 1200)}`
    : ''

  const prompt = `Genera entre 3 y 5 preguntas de seleccion multiple en espanol para una leccion llamada: "${title}".${contextBlock}

IMPORTANTE: Responde UNICAMENTE con un JSON valido. Sin explicaciones. Sin markdown. Sin bloques de codigo. Solo el JSON crudo.

Formato exacto:
{"questions":[{"question":"pregunta aqui","options":["opcion A","opcion B","opcion C","opcion D"],"correctIndex":0,"explanation":"explicacion breve"}]}`

  try {
    const raw = await generateContent({
      systemInstruction: 'Eres un asistente educativo venezolano. Generas preguntas de evaluacion claras y pedagogicas. Respondes SOLO con JSON valido, sin markdown ni texto adicional.',
      messages: [{ role: 'user', text: prompt }],
    })

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'La IA no genero un formato valido' }, { status: 502 })

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed.questions)) return NextResponse.json({ error: 'Formato invalido' }, { status: 502 })

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Error al generar preguntas' }, { status: 502 })
  }
}
