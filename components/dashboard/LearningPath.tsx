'use client'

import Link from 'next/link'

export interface PathCourse {
  courseId: string
  title: string
  order: number
  status: 'completed' | 'current' | 'locked'
  progressPercent: number
}

// Winding positions: center → right → center → left (repeating)
const CONTAINER_W = 320
const NODE_R = 36         // radius of node circle
const SPACING = 160       // vertical distance between node centers
const TOP = 80

const X_PATTERN = [160, 236, 160, 84] // center, right, center, left

function nx(i: number) { return X_PATTERN[i % 4] }
function ny(i: number) { return TOP + i * SPACING }

function svgPath(pts: {x: number; y: number}[]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i]
    const mid = (p.y + c.y) / 2
    d += ` C ${p.x} ${mid} ${c.x} ${mid} ${c.x} ${c.y}`
  }
  return d
}

export default function LearningPath({ courses }: { courses: PathCourse[] }) {
  const pts = courses.map((_, i) => ({ x: nx(i), y: ny(i) }))
  const svgH = TOP + (courses.length - 1) * SPACING + TOP + 40
  const lastActive = courses.reduce((last, c, i) => c.status !== 'locked' ? i : last, -1)

  const bgPath = svgPath(pts)
  const fgPath = svgPath(pts.slice(0, lastActive + 1))

  return (
    <div className="flex justify-center py-6 overflow-x-hidden">
      <div className="relative" style={{ width: CONTAINER_W, height: svgH }}>

        {/* Path SVG */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CONTAINER_W}
          height={svgH}
          viewBox={`0 0 ${CONTAINER_W} ${svgH}`}
        >
          {bgPath && <path d={bgPath} fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />}
          {fgPath && <path d={fgPath} fill="none" stroke="#00B5B5" strokeWidth="10" strokeLinecap="round" />}
        </svg>

        {/* Nodes */}
        {courses.map((course, i) => {
          const x = nx(i)
          const y = ny(i)
          const isRight = i % 4 === 1  // right-offset node
          const completed = course.status === 'completed'
          const current = course.status === 'current'
          const locked = course.status === 'locked'

          // Card sits to the side with more space
          const cardLeft = isRight
            ? x - NODE_R - 8 - 118   // card to the left of the right node
            : x + NODE_R + 8          // card to the right

          return (
            <div key={course.courseId} className="absolute" style={{ left: 0, top: 0, width: CONTAINER_W, height: 0 }}>

              {/* Side card */}
              <div
                className={`absolute flex flex-col justify-center rounded-xl px-3 py-2.5 shadow-sm border ${
                  locked ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
                }`}
                style={{ left: Math.max(0, cardLeft), top: y - 30, width: 118 }}
              >
                <p className={`text-[11px] font-semibold leading-tight line-clamp-2 ${locked ? 'text-gray-400' : 'text-gray-800'}`}>
                  {course.title}
                </p>
                {current && course.progressPercent > 0 && (
                  <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00B5B5] rounded-full" style={{ width: `${course.progressPercent}%` }} />
                  </div>
                )}
                {completed && (
                  <p className="text-[10px] text-[#00B5B5] font-medium mt-1">Completado</p>
                )}
              </div>

              {/* "Continuar" badge above current node */}
              {current && (
                <div
                  className="absolute flex justify-center"
                  style={{ left: x - 42, top: y - NODE_R - 32, width: 84 }}
                >
                  <span className="bg-[#1B4F8C] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm whitespace-nowrap">
                    Continuar
                  </span>
                </div>
              )}

              {/* Node circle */}
              <div className="absolute" style={{ left: x - NODE_R, top: y - NODE_R }}>
                {locked ? (
                  <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-md bg-white border-[3px] border-gray-200`}>
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                ) : (
                  <Link
                    href={`/dashboard/courses/${course.courseId}`}
                    className={`w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 ${
                      completed ? 'bg-[#00B5B5]' : 'bg-[#1B4F8C] ring-4 ring-[#1B4F8C]/20'
                    }`}
                  >
                    {completed ? (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
