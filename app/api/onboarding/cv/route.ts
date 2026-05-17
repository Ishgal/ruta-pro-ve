import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const MAX_CV_TEXT = 8000

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Usar require en lugar de import para evitar problemas de tipos
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const result = await pdfParse(buffer)
    return (result.text ?? '').slice(0, MAX_CV_TEXT).trim()
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Formato de solicitud invalido' }, { status: 400 })
  }

  const file = formData.get('cv') as File | null
  if (!file) return NextResponse.json({ error: 'Archivo no recibido' }, { status: 400 })

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo no puede superar 5 MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const cvText = await extractPdfText(buffer)

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { cvAnalysisNotes: cvText || null },
    create: {
      userId: user.id,
      educationLevel: '',
      career: '',
      hasWorkExperience: false,
      employmentStatus: '',
      primaryGoal: '',
      timeline: '',
      weeklyHours: '',
      location: '',
      workModality: '',
      cvAnalysisNotes: cvText || null,
    },
  })

  return NextResponse.json({ success: true, hasText: cvText.length > 0 })
}