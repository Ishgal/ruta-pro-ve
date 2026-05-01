import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (dbUser?.role !== 'estudiante') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  const {
    educationLevel, career, university, academicYear, graduationYear,
    hasWorkExperience, workExperienceYears, jobRole, employmentStatus,
    primaryGoal, timeline, declaredStrengths,
    weeklyHours, location, workModality,
    cvUrl,
  } = body

  const profileData = {
    educationLevel, career,
    university: university || null,
    academicYear: academicYear || null,
    graduationYear: graduationYear ? Number(graduationYear) : null,
    hasWorkExperience,
    workExperienceYears: workExperienceYears ? Number(workExperienceYears) : null,
    jobRole: jobRole || null,
    employmentStatus, primaryGoal, timeline,
    declaredStrengths: declaredStrengths ?? [],
    weeklyHours, location, workModality,
    cvUrl: cvUrl || null,
  }

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: profileData,
    create: { userId: user.id, ...profileData },
  })

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { generatedRoute, onboardingChat, assignedStartLevel } = await request.json()

  await prisma.studentProfile.update({
    where: { userId: user.id },
    data: {
      generatedRoute: generatedRoute ?? undefined,
      onboardingChat: onboardingChat ?? undefined,
      assignedStartLevel: assignedStartLevel ?? 1,
      completedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
