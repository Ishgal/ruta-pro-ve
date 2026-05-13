import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { createElement } from 'react'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    padding: 0,
  },
  topBar: {
    backgroundColor: '#1B4F8C',
    height: 8,
  },
  body: {
    paddingHorizontal: 56,
    paddingVertical: 48,
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
    alignSelf: 'flex-start',
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: '#1B4F8C',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0D2040',
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  heroDivider: {
    width: 48,
    height: 3,
    backgroundColor: '#00B5B5',
    borderRadius: 2,
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#00B5B5',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  headline: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: '#0D2040',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.1,
  },
  studentName: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#1B4F8C',
    textAlign: 'center',
    marginBottom: 6,
  },
  completionText: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0D2040',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 400,
  },
  tealDivider: {
    width: 380,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 28,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 380,
    marginBottom: 32,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textAlign: 'center',
  },
  metaDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: '#0D2040',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 56,
    justifyContent: 'space-between',
  },
  bottomText: {
    fontSize: 7,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  bottomAccent: {
    fontSize: 7,
    color: '#00B5B5',
    letterSpacing: 0.5,
  },
})

type CertData = {
  studentName: string
  courseTitle: string
  issuedAt: Date
  qrCode: string
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
}

function CertificateDoc({ data }: { data: CertData }) {
  return createElement(
    Document,
    {
      title: `Certificado — ${data.courseTitle}`,
      author: 'Ruta Pro-VE',
      subject: 'Certificado de finalización de curso',
    },
    createElement(
      Page,
      { size: 'A4', orientation: 'landscape', style: styles.page },
      // Top bar
      createElement(View, { style: styles.topBar }),
      // Body
      createElement(
        View,
        { style: styles.body },
        // Logo row
        createElement(
          View,
          { style: styles.logoRow },
          createElement(
            View,
            { style: styles.logoBox },
            createElement(Text, { style: styles.logoText }, 'RP')
          ),
          createElement(
            View,
            null,
            createElement(Text, { style: styles.brandName }, 'Ruta Pro-VE'),
            createElement(Text, { style: styles.brandSub }, 'Plataforma de aprendizaje profesional')
          )
        ),
        // Hero divider
        createElement(View, { style: styles.heroDivider }),
        // Eyebrow
        createElement(Text, { style: styles.eyebrow }, 'Certificado de finalización'),
        // Headline
        createElement(Text, { style: styles.headline }, 'Con Distinción'),
        // Subheadline
        createElement(Text, { style: styles.subheadline }, 'Este certificado acredita que el siguiente estudiante completó satisfactoriamente:'),
        // Student name
        createElement(Text, { style: styles.studentName }, data.studentName),
        // Completion text
        createElement(Text, { style: styles.completionText }, 'el curso'),
        // Course title
        createElement(Text, { style: styles.courseTitle }, data.courseTitle),
        // Divider
        createElement(View, { style: styles.tealDivider }),
        // Meta row
        createElement(
          View,
          { style: styles.metaRow },
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, 'Fecha de emisión'),
            createElement(Text, { style: styles.metaValue }, formatDate(data.issuedAt))
          ),
          createElement(View, { style: styles.metaDivider }),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, 'Código de verificación'),
            createElement(Text, { style: styles.metaValue }, data.qrCode.slice(0, 16).toUpperCase())
          ),
          createElement(View, { style: styles.metaDivider }),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, 'Plataforma'),
            createElement(Text, { style: styles.metaValue }, 'rutapro-ve.vercel.app')
          )
        )
      ),
      // Bottom bar
      createElement(
        View,
        { style: styles.bottomBar },
        createElement(Text, { style: styles.bottomText }, `ID: ${data.qrCode}`),
        createElement(Text, { style: styles.bottomAccent }, 'ruta-pro-ve.com')
      )
    )
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { certId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { id: certId },
    select: {
      id: true,
      userId: true,
      pdfUrl: true,
      qrCode: true,
      issuedAt: true,
      course: { select: { title: true } },
      user: { select: { name: true } },
    },
  })

  if (!cert) return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 })

  // Only the owner or an admin can download
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (cert.userId !== user.id && dbUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  // Certificate must be unlocked
  if (!cert.pdfUrl) {
    return NextResponse.json({ error: 'Certificado no desbloqueado' }, { status: 403 })
  }

  const data: CertData = {
    studentName: cert.user.name ?? 'Estudiante',
    courseTitle: cert.course.title,
    issuedAt: cert.issuedAt ?? new Date(),
    qrCode: cert.qrCode,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(CertificateDoc, { data }) as any)

  const filename = `certificado-${cert.course.title.toLowerCase().replace(/\s+/g, '-')}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
