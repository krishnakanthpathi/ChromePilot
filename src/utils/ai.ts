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

export async function generateAutoSuggestion(
  provider: AIProvider, 
  apiKey: string, 
  modelChoice: string,
  codeContext: string,
  commentText: string
): Promise<string> {
  const prompt = `You are an AI coding assistant. Generate code purely based on following comment. Do not try to solve the overall question, only implement what the comment strictly asks for.

Program context:
${codeContext}

Target Comment:
${commentText}

Provide ONLY the raw code implementation for the target comment. 
CRITICAL RULES FOR OUTPUT:
1. DO NOT output any conversational text, greetings, explanations, or notes.
2. DO NOT wrap the code in markdown formatting (no \`\`\` language blocks).
3. DO NOT output the target comment itself.
4. DO NOT write or generate any code comments in your output. Only return executable code statements.
5. Output strictly the raw code that belongs after the comment.`;

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
