const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

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
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  const data = await res.json()
  return (data.choices[0]?.message?.content as string) ?? ''
}
