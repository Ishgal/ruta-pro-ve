'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LessonEditor from '@/components/admin/lessons/LessonEditor'

interface FetchedLesson {
  title: string
  displayOrder: number
  duration: string | null
  isFreePreview: boolean
  lessonType: string
  videoUrl: string | null
  content: string | null
  slidesUrl: string | null
  quizData: { questions?: { question: string; options: [string,string,string,string]; correctIndex: number; explanation: string }[] } | null
}

export default function EditLessonPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const lessonId = params.lessonId as string
  const backUrl = `/admin/courses/${courseId}/lessons`

  const [lesson, setLesson] = useState<FetchedLesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/lessons/${lessonId}`)
      .then(r => r.json())
      .then(data => { setLesson(data); setLoading(false) })
      .catch(() => { router.push(backUrl) })
  }, [lessonId, backUrl, router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">Cargando leccion...</p>
        </div>
      </div>
    )
  }

  if (!lesson) return null

  return (
    <LessonEditor
      courseId={courseId}
      lessonId={lessonId}
      initialData={lesson}
      backUrl={backUrl}
    />
  )
}
