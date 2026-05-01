import { NextResponse } from 'next/server'

export const revalidate = 3600 // refresh once per hour

export async function GET() {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`dolarapi ${res.status}`)
    const data = await res.json()
    const rate: number = data.promedio ?? data.venta ?? null
    return NextResponse.json({ rate, updatedAt: data.fechaActualizacion ?? null })
  } catch (err) {
    console.error('[bcv-rate]', err)
    return NextResponse.json({ rate: null, updatedAt: null }, { status: 503 })
  }
}
