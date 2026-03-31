import { NextRequest, NextResponse } from 'next/server';
import { JUDGE_SYSTEM_PROMPT, buildJudgeUserPrompt } from '@/lib/judge-prompt';

interface JudgeRequest {
  pid: string;
  images: string[]; // URLs or base64 data URIs
  apiKey: string;
}

export async function POST(request: NextRequest) {
  let body: JudgeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { pid, images, apiKey } = body;

  if (!pid || !images?.length || !apiKey) {
    return NextResponse.json({ error: 'Missing pid, images, or apiKey' }, { status: 400 });
  }

  try {
    const result = await judgeWithGemini(pid, images, apiKey);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function judgeWithGemini(pid: string, images: string[], apiKey: string) {
  const imageParts = await Promise.all(
    images.map(async (img, i) => {
      if (img.startsWith('data:')) {
        // base64 data URI
        const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error(`Invalid data URI for image ${i + 1}`);
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        };
      } else {
        // URL — download server-side and convert to base64
        const res = await fetch(img, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        });
        if (!res.ok) throw new Error(`Failed to fetch image ${i + 1}: ${res.status}`);
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        return {
          inlineData: {
            mimeType: contentType,
            data: base64,
          },
        };
      }
    })
  );

  const contents = [
    {
      role: 'user' as const,
      parts: [
        ...imageParts,
        { text: buildJudgeUserPrompt(pid, images.length) },
      ],
    },
  ];

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: JUDGE_SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(120000),
    }
  );

  if (!geminiRes.ok) {
    const errBody = await geminiRes.text();
    throw new Error(`Gemini API error (${geminiRes.status}): ${errBody}`);
  }

  const geminiData = await geminiRes.json();
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  // Parse JSON from response (strip any markdown fences if present)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
