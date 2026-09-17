import type { QAPair } from '../shared/messaging';

// ─── Gemini REST API ────────────────────────────────────────────────────────

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstruction: string,
  jsonMode = false
): Promise<string> {
  const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      ...(jsonMode && { responseMimeType: 'application/json' }),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Gemini API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      message = errorJson?.error?.message || message;
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Empty response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

// ─── Question Generation ────────────────────────────────────────────────────

const QUESTION_SYSTEM = `You are an expert email assistant. Your job is to analyze an email thread and identify 2-3 essential clarifying questions that would help write a complete, thoughtful, and appropriate reply.

Rules:
- Generate exactly 2 to 3 questions
- Questions should cover: intent/tone, key details to confirm, and any decisions to be made
- Keep questions concise and specific to the email content
- Return ONLY a JSON array of question strings, nothing else

Example output: ["What tone should the reply have — formal or casual?", "Should I confirm attending the meeting on Thursday?", "Do you want to address the budget concern they raised?"]`;

export async function generateQuestions(
  apiKey: string,
  model: string,
  emailContext: string
): Promise<string[]> {
  const prompt = `Here is the email thread I need to reply to:\n\n---\n${emailContext}\n---\n\nGenerate 2-3 clarifying questions to help me write the best reply.`;

  const raw = await callGemini(apiKey, model, prompt, QUESTION_SYSTEM, true);

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((q) => typeof q === 'string')) {
      return parsed;
    }
    // Handle case where API returns { questions: [...] }
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions;
    }
    throw new Error('Unexpected response format');
  } catch (e) {
    // Try to extract array from response text
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Failed to parse questions: ${e}`);
  }
}

// ─── Draft Generation ───────────────────────────────────────────────────────

const DRAFT_SYSTEM = `You are an expert email writer. Given an email thread and the user's answers to clarifying questions, write a professional and natural email reply.

Rules:
- Write ONLY the email body text
- Match the tone indicated by the user's answers
- Be concise but thorough
- Do NOT include email headers (To, From, Subject, Date)
- Do NOT include an email signature
- Use proper paragraph spacing
- The reply should feel human-written, not robotic`;

export async function generateDraft(
  apiKey: string,
  model: string,
  emailContext: string,
  answers: QAPair[]
): Promise<string> {
  const qaBlock = answers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  const prompt = `Original email thread:\n\n---\n${emailContext}\n---\n\nMy answers to the clarifying questions:\n\n${qaBlock}\n\nPlease write the reply email based on the thread and my answers above.`;

  return callGemini(apiKey, model, prompt, DRAFT_SYSTEM, false);
}
