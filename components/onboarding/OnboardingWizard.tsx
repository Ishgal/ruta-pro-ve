'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import Ruty from '@/components/mascot/Ruty'

// ─── PDF thumbnail ────────────────────────────────────────────────────────────

const THUMB_W = 80  // CSS pixels

function PdfThumbnail({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [thumbH, setThumbH] = useState(104)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const data = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data }).promise
        if (cancelled) return
        const page = await pdf.getPage(1)
        if (cancelled) return
        const canvas = canvasRef.current
        if (!canvas) return

        // Render at device pixel ratio for sharp output
        const dpr = window.devicePixelRatio || 1
        const vp = page.getViewport({ scale: 1 })
        const scale = (THUMB_W * dpr) / vp.width
        const scaled = page.getViewport({ scale })
        const cssH = Math.round(scaled.height / dpr)

        canvas.width = scaled.width
        canvas.height = scaled.height
        canvas.style.width = `${THUMB_W}px`
        canvas.style.height = `${cssH}px`

        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        await page.render({ canvasContext: ctx, viewport: scaled }).promise

        if (!cancelled) { setThumbH(cssH); setReady(true) }
      } catch { /* silently skip */ }
    }
    void render()
    return () => { cancelled = true }
  }, [file])

  return (
    <div
      className="rounded-lg overflow-hidden bg-gray-50 border border-[#B3E8E8] flex-shrink-0 flex items-center justify-center shadow-sm"
      style={{ width: THUMB_W, height: thumbH }}
    >
      {!ready && (
        <svg className="w-4 h-4 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      <canvas ref={canvasRef} style={{ display: ready ? 'block' : 'none' }} />
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface StrengthEntry { skill: string; level: 'basico' | 'intermedio' | 'avanzado' }

interface WizardData {
  educationLevel: string
  career: string
  university: string
  academicYear: string
  graduationYear: string
  hasWorkExperience: boolean | null
  workExperienceYears: string
  jobRole: string
  employmentStatus: string
  primaryGoal: string
  timeline: string
  declaredStrengths: StrengthEntry[]
  weeklyHours: string
  location: string
  workModality: string
}

interface ChatMessage { role: 'user' | 'ai'; text: string }
interface CourseRoute { courseId: string; title: string; reason: string; order: number }
interface RouteData { type: string; summary: string; assignedStartLevel: number; route: CourseRoute[] }

const EMPTY: WizardData = {
  educationLevel: '', career: '', university: '', academicYear: '', graduationYear: '',
  hasWorkExperience: null, workExperienceYears: '', jobRole: '', employmentStatus: '',
  primaryGoal: '', timeline: '',
  declaredStrengths: [],
  weeklyHours: '', location: '', workModality: '',
}

// ─── Static data ─────────────────────────────────────────────────────────────

const SKILLS: Record<string, string[]> = {
  contaduria: [
    'Contabilidad básica', 'Excel', 'Estados financieros', 'Declaraciones ISLR/IVA',
    'Contabilidad de costos', 'Auditoría', 'NIIF', 'Nómina',
    'Matemática financiera', 'Análisis financiero', 'Presupuestos', 'Conciliaciones bancarias',
  ],
  sistemas: [
    'Lógica de programación', 'Bases de datos', 'HTML/CSS', 'JavaScript',
    'Python', 'Control de versiones (Git)', 'APIs REST', 'Seguridad informática',
    'Arquitectura de software', 'Cloud computing', 'React/Next.js', 'Node.js',
  ],
}

const VE_STATES = [
  'Distrito Capital', 'Miranda', 'Carabobo', 'Zulia', 'Lara', 'Aragua',
  'Bolívar', 'Anzoátegui', 'Táchira', 'Mérida', 'Monagas', 'Sucre',
  'Falcón', 'Barinas', 'Portuguesa', 'Nueva Esparta', 'Trujillo',
  'Yaracuy', 'Guárico', 'Cojedes', 'Apure', 'Amazonas', 'Delta Amacuro', 'Vargas',
  'Exterior',
]

const TOTAL_STEPS = 7

// ─── Small helpers ────────────────────────────────────────────────────────────

function OptionCard({ label, sublabel, selected, onClick }: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
        selected
          ? 'border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D]'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className="font-semibold text-sm">{label}</span>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </button>
  )
}

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <span className="text-xs font-semibold text-[#00B5B5] uppercase tracking-widest">Paso {step} de {TOTAL_STEPS}</span>
      <h2 className="text-xl font-bold text-gray-900 mt-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white/95 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingWizard({ userName }: { userName: string }) {
  const router = useRouter()
  const firstName = userName.split(' ')[0]

  // Form state
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [data, setData] = useState<WizardData>(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // CV upload state
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvUploaded, setCvUploaded] = useState(false)
  const [cvUploadError, setCvUploadError] = useState('')

  // Phase state
  const [phase, setPhase] = useState<'form' | 'chat' | 'done'>('form')

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [aiThinking, setAiThinking] = useState(false)
  const chatStartedRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Route state
  const [generatedRoute, setGeneratedRoute] = useState<RouteData | null>(null)
  const [finishing, setFinishing] = useState(false)

  // Confetti when route is ready
  useEffect(() => {
    if (phase !== 'done') return
    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.4 },
      colors: ['#00B5B5', '#F59E0B', '#1B4F8C', '#ffffff'],
    })
  }, [phase])

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiThinking])

  // Kick off AI first message when chat phase starts
  useEffect(() => {
    if (phase !== 'chat' || chatStartedRef.current) return
    chatStartedRef.current = true
    setAiThinking(true)
    fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [], profileData: data }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.routeReady) {
          setGeneratedRoute(json.routeData)
          fetch('/api/onboarding', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generatedRoute: json.routeData, onboardingChat: [], assignedStartLevel: json.routeData.assignedStartLevel }),
          }).then(() => setPhase('done'))
          return
        }
        setAiThinking(false)
        if (json.reply) {
          setMessages([{ role: 'ai', text: json.reply }])
        } else {
          setMessages([{ role: 'ai', text: 'Hubo un error al conectar con la IA. Recarga la pagina e intenta de nuevo.' }])
        }
      })
      .catch(() => {
        setAiThinking(false)
        setMessages([{ role: 'ai', text: 'No se pudo conectar con la IA. Verifica tu conexion e intenta de nuevo.' }])
      })
  }, [phase]) // data is stable once form is submitted — intentional

  // ── Form helpers ──────────────────────────────────────────────────────────

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
    setError('')
  }

  function validate(): boolean {
    if (step === 1) {
      if (!data.educationLevel) { setError('Selecciona tu nivel educativo.'); return false }
      if (!data.career) { setError('Selecciona tu carrera.'); return false }
    }
    if (step === 2) {
      if (data.hasWorkExperience === null) { setError('Indica si tienes experiencia laboral.'); return false }
      if (data.hasWorkExperience && !data.workExperienceYears) { setError('Indica los años de experiencia.'); return false }
      if (!data.employmentStatus) { setError('Selecciona tu situación actual.'); return false }
    }
    if (step === 3) {
      if (!data.primaryGoal) { setError('Selecciona tu objetivo principal.'); return false }
      if (!data.timeline) { setError('Selecciona tu plazo de tiempo.'); return false }
    }
    if (step === 4) {
      if (data.declaredStrengths.length === 0) { setError('Selecciona al menos una fortaleza.'); return false }
    }
    if (step === 5) {
      if (!data.weeklyHours) { setError('Indica tu disponibilidad semanal.'); return false }
      if (!data.location) { setError('Selecciona tu ubicación.'); return false }
      if (!data.workModality) { setError('Selecciona la modalidad de trabajo.'); return false }
    }
    return true
  }

  function next() {
    if (!validate()) return
    setDirection(1)
    setStep(s => s + 1)
  }

  function back() {
    setError('')
    setDirection(-1)
    setStep(s => s - 1)
  }

  function toggleStrength(skill: string) {
    setData(prev => {
      const exists = prev.declaredStrengths.find(s => s.skill === skill)
      if (exists) return { ...prev, declaredStrengths: prev.declaredStrengths.filter(s => s.skill !== skill) }
      return { ...prev, declaredStrengths: [...prev.declaredStrengths, { skill, level: 'basico' }] }
    })
    setError('')
  }

  function setStrengthLevel(skill: string, level: StrengthEntry['level']) {
    setData(prev => ({
      ...prev,
      declaredStrengths: prev.declaredStrengths.map(s => s.skill === skill ? { ...s, level } : s),
    }))
  }

  async function handleSubmit() {
    setSaving(true)
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (res.ok) {
      setPhase('chat')
    } else {
      setError('Hubo un error al guardar. Intenta de nuevo.')
    }
  }

  async function uploadCv(file: File) {
    setCvUploading(true)
    setCvUploadError('')
    const fd = new FormData()
    fd.append('cv', file)
    try {
      const res = await fetch('/api/onboarding/cv', { method: 'POST', body: fd })
      if (res.ok) {
        setCvUploaded(true)
      } else {
        const json = await res.json().catch(() => ({}))
        setCvUploadError((json as { error?: string }).error ?? 'Error al subir el CV')
      }
    } catch {
      setCvUploadError('No se pudo subir el CV. Puedes continuar sin el.')
    } finally {
      setCvUploading(false)
    }
  }

  function handleCvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setCvFile(file)
    setCvUploaded(false)
    setCvUploadError('')
    void uploadCv(file)
  }

  // ── Chat helpers ──────────────────────────────────────────────────────────

  async function sendMessage(currentMessages: ChatMessage[]) {
    setAiThinking(true)
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, profileData: data }),
      })
      const json = await res.json()
      if (json.routeReady) {
        setGeneratedRoute(json.routeData)
        await saveRouteToDb(json.routeData, currentMessages)
        setPhase('done')
        return
      }
      setAiThinking(false)
      if (json.reply) {
        setMessages(prev => [...prev, { role: 'ai', text: json.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'Hubo un error. Intenta enviar tu mensaje de nuevo.' }])
      }
    } catch {
      setAiThinking(false)
      setMessages(prev => [...prev, { role: 'ai', text: 'No se pudo conectar con la IA. Intenta de nuevo.' }])
    }
  }

  async function saveRouteToDb(route: RouteData, chat: ChatMessage[]) {
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedRoute: route,
        onboardingChat: chat,
        assignedStartLevel: route.assignedStartLevel,
      }),
    })
  }

  async function handleSend() {
    if (!inputValue.trim() || aiThinking) return
    const userMsg: ChatMessage = { role: 'user', text: inputValue.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputValue('')
    await sendMessage(newMessages)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  async function handleFinish() {
    setFinishing(true)
    router.push('/dashboard')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: done — route ready
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'done' && generatedRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D2040] to-[#1B4F8C] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-7">
            {/* Ruty celebrando */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex justify-center mb-3"
            >
              <Ruty pose="celebrando" size={130} />
            </motion.div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Tu ruta esta lista</h2>
            <p className="text-sm text-gray-500 text-center mb-5">Ruty analizo tu perfil y preparo este plan personalizado para ti.</p>

            {/* AI summary */}
            <div className="bg-[#F0FAFA] border border-[#B3E8E8] rounded-xl px-4 py-3.5 mb-5">
              <p className="text-sm text-[#007B7D] leading-relaxed">{generatedRoute.summary}</p>
            </div>

            {/* Course list */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tu ruta de aprendizaje</p>
              <div className="flex flex-col gap-2.5">
                {generatedRoute.route
                  .sort((a, b) => a.order - b.order)
                  .map((course, i) => (
                    <div key={course.courseId} className="flex gap-3 items-start bg-gray-50 rounded-xl px-3.5 py-3">
                      <span className="w-6 h-6 rounded-full bg-[#00B5B5] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{course.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{course.reason}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              disabled={finishing}
              className="w-full py-3.5 rounded-xl bg-[#00B5B5] hover:bg-[#009999] text-white font-semibold text-sm transition-all disabled:opacity-60"
            >
              {finishing ? 'Entrando al dashboard...' : 'Comenzar mi aprendizaje'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: chat — Ruty Duolingo-style interview
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'chat') {
    const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai')
    const aiMessageCount = messages.filter(m => m.role === 'ai').length

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D2040] to-[#1B4F8C] flex justify-center">
        {/* Contenedor fijo ancho-telefono — centrado en desktop */}
        <div className="w-full max-w-[420px] flex flex-col min-h-screen">

          {/* Header */}
          <div className="flex items-center justify-center pt-5 pb-0">
            <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase">Entrevista de perfil</p>
          </div>

          {/* Ruty + burbuja — flex row, Ruty izquierda, burbuja derecha */}
          <div className="flex-1 flex items-center px-3 gap-3">

            {/* Ruty — izquierda */}
            <AnimatePresence mode="wait">
              <motion.div
                key={aiThinking ? 'ruty-thinking' : 'ruty-talking'}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ flexShrink: 0 }}
              >
                <Ruty pose={aiThinking ? 'pensando' : 'hablando'} size={200} />
              </motion.div>
            </AnimatePresence>

            {/* Burbuja — derecha, crece para llenar el espacio */}
            <div className="flex-1 relative">
              {/* Cola apuntando hacia Ruty */}
              <div
                className="absolute -left-3 top-6 w-6 h-6 bg-white rotate-45 rounded-sm"
                style={{ zIndex: 0 }}
              />
              <div className="relative z-10 bg-white rounded-2xl px-4 py-4 shadow-2xl min-h-[72px] flex items-center">
                <AnimatePresence mode="wait">
                  {aiThinking ? (
                    <motion.div
                      key="dots"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex gap-2 py-1"
                    >
                      <span className="w-2.5 h-2.5 bg-[#00B5B5] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2.5 h-2.5 bg-[#00B5B5] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2.5 h-2.5 bg-[#00B5B5] rounded-full animate-bounce" />
                    </motion.div>
                  ) : (
                    <motion.p
                      key={`msg-${aiMessageCount}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="text-sm text-gray-800 leading-relaxed"
                    >
                      {lastAiMsg?.text ?? ''}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="px-4 pb-8 pt-3">
            <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-1.5">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu respuesta..."
                rows={1}
                disabled={aiThinking}
                className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm px-3 py-2 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              <motion.button
                type="button"
                onClick={() => void handleSend()}
                disabled={!inputValue.trim() || aiThinking}
                whileTap={{ scale: 0.88 }}
                className="w-10 h-10 rounded-xl bg-[#00B5B5] hover:bg-[#009999] flex items-center justify-center flex-shrink-0 self-end transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </motion.button>
            </div>
            <p className="text-center text-white/30 text-xs mt-2">Presiona Enter para enviar</p>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: form — existing wizard steps
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D2040] to-[#1B4F8C] flex items-center justify-center px-4 py-4 md:py-10">
      <div className="w-full max-w-lg">

        {/* Logo / greeting */}
        <div className="text-center mb-4 md:mb-8">
          <p className="text-[#8BAECE] text-sm mb-1">Bienvenido, {firstName}</p>
          <h1 className="text-white text-2xl font-bold">Construyamos tu ruta de aprendizaje</h1>
          <p className="text-[#8BAECE] text-sm mt-1">Solo toma unos minutos. Cuentanos sobre ti.</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-4 md:mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? 'bg-[#00B5B5]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-5 md:p-7">

          <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >

          {/* ── STEP 1 ── Identidad */}
          {step === 1 && (
            <div>
              <StepHeader step={1} title="Quien eres?" subtitle="Cuentanos sobre tu situacion academica actual." />

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Nivel educativo</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'bachiller', label: 'Bachiller', sublabel: 'Cursando o recien egresado de secundaria' },
                    { value: 'universitario', label: 'Estudiante universitario', sublabel: 'Cursando una carrera actualmente' },
                    { value: 'recien_graduado', label: 'Recien graduado', sublabel: 'Me gradue hace menos de 2 anos' },
                    { value: 'graduado_experiencia', label: 'Graduado con experiencia', sublabel: '2 o mas anos desde que me gradue' },
                  ].map(opt => (
                    <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel}
                      selected={data.educationLevel === opt.value}
                      onClick={() => set('educationLevel', opt.value)} />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  {data.educationLevel === 'bachiller' ? 'Carrera a la que aspiras' : 'Tu carrera'}
                </label>
                <div className="flex gap-2">
                  <OptionCard label="Contaduria Publica" selected={data.career === 'contaduria'} onClick={() => set('career', 'contaduria')} />
                  <OptionCard label="Ing. de Sistemas" selected={data.career === 'sistemas'} onClick={() => set('career', 'sistemas')} />
                </div>
              </div>

              {(data.educationLevel === 'universitario' || data.educationLevel === 'recien_graduado' || data.educationLevel === 'graduado_experiencia') && (
                <div className="mb-5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Universidad <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    type="text"
                    value={data.university}
                    onChange={e => set('university', e.target.value)}
                    placeholder="Ej: UCV, UCAB, USB..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
                  />
                </div>
              )}

              {data.educationLevel === 'universitario' && (
                <div className="mb-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Ano o semestre actual</label>
                  <div className="flex flex-wrap gap-2">
                    {['1er año', '2do año', '3er año', '4to año', '5to año', 'Ultimo semestre'].map(y => (
                      <button key={y} type="button" onClick={() => set('academicYear', y)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                          data.academicYear === y ? 'border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(data.educationLevel === 'recien_graduado' || data.educationLevel === 'graduado_experiencia') && (
                <div className="mb-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Ano de graduacion</label>
                  <input
                    type="number"
                    value={data.graduationYear}
                    onChange={e => set('graduationYear', e.target.value)}
                    placeholder="Ej: 2023"
                    min={1990}
                    max={new Date().getFullYear()}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 ── Experiencia */}
          {step === 2 && (
            <div>
              <StepHeader step={2} title="Tu experiencia" subtitle="Queremos saber desde donde partes." />

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Tienes experiencia laboral en tu area?</label>
                <div className="flex gap-2">
                  <OptionCard label="Si, tengo experiencia" selected={data.hasWorkExperience === true} onClick={() => set('hasWorkExperience', true)} />
                  <OptionCard label="No, soy nuevo" selected={data.hasWorkExperience === false} onClick={() => { set('hasWorkExperience', false); set('workExperienceYears', '0') }} />
                </div>
              </div>

              {data.hasWorkExperience && (
                <>
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Cuantos anos de experiencia?</label>
                    <div className="flex flex-wrap gap-2">
                      {[{ value: '0', label: 'Menos de 1 ano' }, { value: '1', label: '1 - 2 anos' }, { value: '3', label: '3 - 5 anos' }, { value: '5', label: '5+ anos' }].map(opt => (
                        <button key={opt.value} type="button" onClick={() => set('workExperienceYears', opt.value)}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                            data.workExperienceYears === opt.value ? 'border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Cargo o rol actual / mas reciente <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input type="text" value={data.jobRole} onChange={e => set('jobRole', e.target.value)}
                      placeholder="Ej: Asistente contable, Analista de sistemas..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all" />
                  </div>
                </>
              )}

              <div className="mb-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Cual es tu situacion actual?</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'desempleado', label: 'Desempleado', sublabel: 'Buscando mi primer empleo o una nueva oportunidad' },
                    { value: 'empleado', label: 'Empleado', sublabel: 'Trabajo actualmente y quiero crecer' },
                    { value: 'freelance', label: 'Freelance', sublabel: 'Trabajo por cuenta propia' },
                    { value: 'estudiando', label: 'Estudiando a tiempo completo', sublabel: 'Me dedico solo a mis estudios' },
                  ].map(opt => (
                    <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel}
                      selected={data.employmentStatus === opt.value}
                      onClick={() => set('employmentStatus', opt.value)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── Objetivos */}
          {step === 3 && (
            <div>
              <StepHeader step={3} title="Tu objetivo" subtitle="A donde quieres llegar con Ruta Pro-VE?" />

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Objetivo principal</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'primer_empleo', label: 'Conseguir mi primer empleo', sublabel: 'Prepararme para entrar al mercado laboral' },
                    { value: 'crecer', label: 'Crecer en mi empleo actual', sublabel: 'Mejorar mis habilidades para avanzar en mi carrera' },
                    { value: 'cambiar_area', label: 'Cambiar de area o especializacion', sublabel: 'Explorar nuevas ramas dentro de mi carrera' },
                    { value: 'freelance', label: 'Trabajar como freelance', sublabel: 'Ofrecer servicios independientes' },
                    { value: 'emprender', label: 'Emprender mi propio negocio', sublabel: 'Usar mis conocimientos para crear algo propio' },
                  ].map(opt => (
                    <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel}
                      selected={data.primaryGoal === opt.value}
                      onClick={() => set('primaryGoal', opt.value)} />
                  ))}
                </div>
              </div>

              <div className="mb-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">En cuanto tiempo quieres lograrlo?</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'urgente', label: 'Lo antes posible', sublabel: '1 a 3 meses' },
                    { value: 'seis_meses', label: 'En los proximos 6 meses', sublabel: 'Tengo algo de tiempo para prepararme bien' },
                    { value: 'un_año', label: 'En el proximo ano', sublabel: 'Quiero una preparacion profunda y completa' },
                    { value: 'sin_prisa', label: 'Sin prisa, voy a mi ritmo', sublabel: 'Aprendo cuando puedo, sin presion de tiempo' },
                  ].map(opt => (
                    <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel}
                      selected={data.timeline === opt.value}
                      onClick={() => set('timeline', opt.value)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── Fortalezas */}
          {step === 4 && (
            <div>
              <StepHeader step={4} title="Tus fortalezas"
                subtitle="Selecciona las areas donde ya tienes conocimiento e indica tu nivel en cada una." />

              <div className="flex flex-wrap gap-2 mb-5">
                {(SKILLS[data.career] ?? []).map(skill => {
                  const entry = data.declaredStrengths.find(s => s.skill === skill)
                  const selected = !!entry
                  return (
                    <button key={skill} type="button" onClick={() => toggleStrength(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selected ? 'border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {selected && <span className="mr-1">&#10003;</span>}{skill}
                    </button>
                  )
                })}
              </div>

              {data.declaredStrengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cual es tu nivel en cada una?</p>
                  <div className="flex flex-col gap-2">
                    {data.declaredStrengths.map(entry => (
                      <div key={entry.skill} className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
                        <span className="text-sm font-medium text-gray-700 flex-1 mr-3">{entry.skill}</span>
                        <div className="flex gap-1">
                          {(['basico', 'intermedio', 'avanzado'] as const).map(lvl => (
                            <button key={lvl} type="button" onClick={() => setStrengthLevel(entry.skill, lvl)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                entry.level === lvl ? 'bg-[#00B5B5] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}>
                              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5 ── Contexto */}
          {step === 5 && (
            <div>
              <StepHeader step={5} title="Como aprendes" subtitle="Esto nos ayuda a adaptar el ritmo de tu ruta." />

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Horas disponibles por semana</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'uno_a_tres', label: '1 a 3 horas', sublabel: 'Poco tiempo, aprendizaje gradual' },
                    { value: 'tres_a_cinco', label: '3 a 5 horas', sublabel: 'Ritmo moderado y constante' },
                    { value: 'cinco_a_diez', label: '5 a 10 horas', sublabel: 'Dedicacion significativa' },
                    { value: 'diez_mas', label: 'Mas de 10 horas', sublabel: 'Aprendizaje intensivo' },
                  ].map(opt => (
                    <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel}
                      selected={data.weeklyHours === opt.value}
                      onClick={() => set('weeklyHours', opt.value)} />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Donde estas ubicado?</label>
                <select
                  value={data.location}
                  onChange={e => set('location', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
                >
                  <option value="">Selecciona tu ubicacion</option>
                  {VE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="mb-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Modalidad de trabajo que buscas</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'presencial', label: 'Presencial', sublabel: 'Prefiero trabajar en oficina' },
                    { value: 'remoto', label: 'Remoto', sublabel: 'Trabajo desde cualquier lugar' },
                    { value: 'ambos', label: 'Ambas modalidades', sublabel: 'Me adapto a lo que haya' },
                  ].map(opt => (
                    <OptionCard key={opt.value} label={opt.label} sublabel={opt.sublabel}
                      selected={data.workModality === opt.value}
                      onClick={() => set('workModality', opt.value)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6 ── CV upload (opcional) */}
          {step === 6 && (
            <div>
              <StepHeader step={6} title="Tu curriculum vitae" subtitle="Opcional — si lo tienes listo, Valeria lo usara para conocerte mejor y personalizar tu ruta." />

              {!cvFile && !cvUploaded && (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#00B5B5] hover:bg-[#F0FAFA] transition-all group">
                  <svg className="w-8 h-8 text-gray-300 group-hover:text-[#00B5B5] mb-2 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-500 group-hover:text-[#007B7D] transition-colors">Seleccionar PDF</span>
                  <span className="text-xs text-gray-400 mt-1">Maximo 5 MB</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleCvFileChange} />
                </label>
              )}

              {cvFile && !cvUploaded && (
                <div className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border bg-gray-50 ${cvUploadError ? 'border-amber-300' : 'border-gray-200'}`}>
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.25 2.25H6A2.25 2.25 0 003.75 4.5v15A2.25 2.25 0 006 21.75h12A2.25 2.25 0 0020.25 19.5V8.25l-6-6zm0 0v6h6" />
                  </svg>
                  <span className="text-sm text-gray-700 flex-1 truncate">{cvFile.name}</span>
                  {cvUploading ? (
                    <svg className="w-4 h-4 text-[#00B5B5] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setCvFile(null); setCvUploaded(false); setCvUploadError('') }}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                      title="Quitar archivo"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {cvUploadError && (
                <div className="mt-2 flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-amber-50">
                  <p className="text-xs text-amber-700">{cvUploadError}</p>
                  <button
                    type="button"
                    onClick={() => cvFile && void uploadCv(cvFile)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap flex-shrink-0"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {cvUploaded && cvFile && (
                <div className="rounded-xl border border-[#00B5B5] bg-[#E6F8F8] overflow-hidden">
                  {/* Preview + info */}
                  <div className="flex items-start gap-3 p-3">
                    <PdfThumbnail file={cvFile} />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3.5 h-3.5 text-[#00B5B5] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="text-xs font-bold text-[#007B7D] uppercase tracking-wide">Listo</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{cvFile.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">PDF · {(cvFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="flex border-t border-[#C2EDED]">
                    <label className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-[#007B7D] hover:bg-[#D4F4F4] cursor-pointer transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Cambiar archivo
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleCvFileChange} />
                    </label>
                    <div className="w-px bg-[#C2EDED]" />
                    <button
                      type="button"
                      onClick={() => { setCvFile(null); setCvUploaded(false); setCvUploadError('') }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4 text-center">
                Si no tienes CV disponible, puedes continuar sin el.
              </p>
            </div>
          )}

          {/* ── STEP 7 ── Transicion a IA */}
          {step === 7 && (
            <div className="flex flex-col items-center text-center -mt-1">
              <span className="text-xs font-semibold text-[#00B5B5] uppercase tracking-widest mb-2">Paso 7 de {TOTAL_STEPS}</span>

              <Ruty pose="hablando" size={160} className="mb-1" />

              <h2 className="text-xl font-bold text-gray-900 mb-1">Casi listo</h2>
              <p className="text-sm text-gray-500 leading-snug mb-4 max-w-[260px]">
                Voy a hacerte unas preguntas rapidas para armar una ruta que se adapte a ti.
              </p>

              <div className="bg-[#E8F0FB] rounded-xl px-4 py-3 w-full text-left">
                <p className="text-xs text-[#1B4F8C] font-medium">La entrevista toma 3 a 5 minutos</p>
                <p className="text-xs text-[#1B4F8C]/70 mt-0.5">
                  Con tus respuestas, Ruty generara una ruta con los cursos mas relevantes para tu perfil.
                </p>
              </div>
            </div>
          )}

          </motion.div>
          </AnimatePresence>

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-7">
            {step > 1 && (
              <button type="button" onClick={back}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Atras
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button type="button" onClick={next} disabled={step === 6 && cvUploading}
                className="flex-1 py-3 rounded-xl bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold transition-all disabled:opacity-60">
                {step === 6 && cvUploading ? 'Subiendo CV...' : 'Continuar'}
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#1B4F8C] hover:bg-[#163d70] text-white text-sm font-semibold transition-all disabled:opacity-60">
                {saving ? 'Procesando...' : 'Iniciar entrevista con Ruty'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
