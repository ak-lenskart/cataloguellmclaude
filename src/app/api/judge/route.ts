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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchImageAsBase64(url: string, index: number) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`Failed to fetch image ${index + 1}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return {
    inlineData: {
      mimeType: res.headers.get('content-type') || 'image/jpeg',
      data: Buffer.from(buffer).toString('base64'),
    },
  };
}

async function callGemini(apiKey: string, contents: unknown, signal: AbortSignal) {
  const res = await fetch(
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
      signal,
    }
  );
  return res;
}

async function judgeWithGemini(pid: string, images: string[], apiKey: string) {
  // Download all images server-side (sequential to avoid overwhelming Lenskart CDN)
  const imageParts = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.startsWith('data:')) {
      const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) throw new Error(`Invalid data URI for image ${i + 1}`);
      imageParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    } else {
      imageParts.push(await fetchImageAsBase64(img, i));
    }
  }

  const contents = [
    {
      role: 'user' as const,
      parts: [...imageParts, { text: buildJudgeUserPrompt(pid, images.length) }],
    },
  ];

  // Retry with exponential backoff for 429 rate limit errors
  const MAX_RETRIES = 4;
  const BASE_DELAY_MS = 15000; // 15s initial wait on 429

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const geminiRes = await callGemini(apiKey, contents, AbortSignal.timeout(120000));

    if (geminiRes.status === 429) {
      // Check Retry-After header if present
      const retryAfter = geminiRes.headers.get('Retry-After');
      const waitMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt); // 15s, 30s, 60s, 120s

      if (attempt < MAX_RETRIES - 1) {
        await sleep(waitMs);
        continue;
      } else {
        const body = await geminiRes.text();
        throw new Error(`Gemini rate limit exceeded after ${MAX_RETRIES} retries. Try again in a minute. Details: ${body.slice(0, 200)}`);
      }
    }

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini API error (${geminiRes.status}): ${errBody.slice(0, 300)}`);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    // Strip markdown fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  throw new Error('Gemini judge failed after all retries');
}
