const GROQ_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const GROQ_MODEL = 'gemini-3.6-flash'

export async function generateContent({
  systemInstruction,
  messages,
}: {
  systemInstruction: string
  messages: { role: 'user' | 'model'; text: string }[]
}) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.text,
        })),
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  const data = await res.json()
  return (data.choices[0]?.message?.content as string) ?? ''
}
