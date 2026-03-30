export type AIProvider = 'openai' | 'gemini';

export async function generateSuggestion(
  provider: AIProvider, 
  apiKey: string, 
  modelChoice: string,
  codeContext: string,
  query: string
): Promise<string> {
  const prompt = `You are a competitive programming assistant. Here is the current code in the editor:\n\n${codeContext}\n\nThe user is asking for completion or suggestion: ${query}. Please provide ONLY the raw code snippet to insert at the cursor. Do not provide markdown formatting like \`\`\`python, just the raw code.`;

  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelChoice || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.choices[0].message.content.trim().replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
  } else if (provider === 'gemini') {
    const geminiModel = modelChoice || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.candidates[0].content.parts[0].text.trim().replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
  }
  
  throw new Error('Invalid provider');
}

export function extractMonacoCode(): string {
  const lines = Array.from(document.querySelectorAll('.view-line'));
  return lines.map(line => line.textContent || '').join('\n');
}
