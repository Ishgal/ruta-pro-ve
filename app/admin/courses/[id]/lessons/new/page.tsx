'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import LessonEditor from '@/components/admin/lessons/LessonEditor'

export default function NewLessonPage() {
  const params = useParams()
  const courseId = params.id as string
  const [nextOrder, setNextOrder] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/admin/courses/${courseId}/lessons`)
      .then(r => r.json())
      .then((lessons: { displayOrder: number }[]) => {
        const max = lessons.length > 0 ? Math.max(...lessons.map(l => l.displayOrder)) : 0
        setNextOrder(max + 1)
      })
      .catch(() => setNextOrder(1))
  }, [courseId])

  if (nextOrder === null) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <LessonEditor
      courseId={courseId}
      initialData={{ displayOrder: nextOrder }}
      backUrl={`/admin/courses/${courseId}/lessons`}
    />
  )
}
