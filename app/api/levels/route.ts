// app/api/levels/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const levels = await prisma.level.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true }
  })
  return NextResponse.json(levels)
}