'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

const TOTAL_STEPS = 6

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
  const [data, setData] = useState<WizardData>(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
        setAiThinking(false)
        if (json.routeReady) {
          setGeneratedRoute(json.routeData)
          fetch('/api/onboarding', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generatedRoute: json.routeData, onboardingChat: [], assignedStartLevel: json.routeData.assignedStartLevel }),
          }).then(() => setPhase('done'))
        } else if (json.reply) {
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
    setStep(s => s + 1)
  }

  function back() {
    setError('')
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
      setAiThinking(false)
      if (json.routeReady) {
        // Don't show the raw JSON — transition directly to route-ready screen
        setGeneratedRoute(json.routeData)
        await saveRouteToDb(json.routeData, currentMessages)
        setPhase('done')
      } else if (json.reply) {
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
            {/* Success icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[#E6F8F8] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#00B5B5]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Tu ruta esta lista</h2>
            <p className="text-sm text-gray-500 text-center mb-5">Valeria analizo tu perfil y preparo este plan personalizado para ti.</p>

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
  // PHASE: chat — Valeria interviewer
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'chat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D2040] to-[#1B4F8C] flex flex-col">

        {/* Chat header */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00B5B5] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Valeria</p>
            <p className="text-[#8BAECE] text-xs">Coach IA · Ruta Pro-VE</p>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#00B5B5] text-white rounded-br-sm'
                  : 'bg-white/95 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {aiThinking && <ThinkingBubble />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 pb-6 pt-2">
          <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-1.5">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta..."
              rows={1}
              disabled={aiThinking}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm px-3 py-2 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!inputValue.trim() || aiThinking}
              className="w-10 h-10 rounded-xl bg-[#00B5B5] hover:bg-[#009999] flex items-center justify-center flex-shrink-0 self-end transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="text-center text-white/30 text-xs mt-2">Presiona Enter para enviar</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: form — existing wizard steps
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D2040] to-[#1B4F8C] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Logo / greeting */}
        <div className="text-center mb-8">
          <p className="text-[#8BAECE] text-sm mb-1">Bienvenido, {firstName}</p>
          <h1 className="text-white text-2xl font-bold">Construyamos tu ruta de aprendizaje</h1>
          <p className="text-[#8BAECE] text-sm mt-2">Solo toma unos minutos. Cuentanos sobre ti.</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
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
        <div className="bg-white rounded-2xl shadow-xl p-7">

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

          {/* ── STEP 6 ── Transicion a IA */}
          {step === 6 && (
            <div>
              <StepHeader step={6} title="Casi listo" subtitle="Ahora Valeria, nuestra coach IA, terminara de conocerte en una breve entrevista." />

              <div className="border border-gray-100 rounded-xl p-5 mb-5 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-[#00B5B5] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">V</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Valeria, tu coach personal</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Voy a hacerte unas preguntas rapidas para entender mejor tu situacion y armar una ruta de aprendizaje que de verdad se adapte a ti. No hay respuestas incorrectas.
                  </p>
                </div>
              </div>

              <div className="bg-[#E8F0FB] rounded-xl px-4 py-3.5">
                <p className="text-xs text-[#1B4F8C] font-medium">La entrevista toma 3 a 5 minutos</p>
                <p className="text-xs text-[#1B4F8C]/70 mt-0.5">
                  Con tus respuestas, Valeria generara una ruta personalizada con los cursos mas relevantes para tu perfil y objetivo.
                </p>
              </div>
            </div>
          )}

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
              <button type="button" onClick={next}
                className="flex-1 py-3 rounded-xl bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold transition-all">
                Continuar
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#1B4F8C] hover:bg-[#163d70] text-white text-sm font-semibold transition-all disabled:opacity-60">
                {saving ? 'Procesando...' : 'Iniciar entrevista con Valeria'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
