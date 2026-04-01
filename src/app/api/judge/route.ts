import { NextRequest, NextResponse } from 'next/server';
import { JUDGE_SYSTEM_PROMPT, buildJudgeUserPrompt } from '@/lib/judge-prompt';

interface JudgeRequest {
  pid: string;
  images: string[];
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function guessMime(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function buildImagePart(img: string, index: number) {
  // base64 data URI from Upload tab
  if (img.startsWith('data:')) {
    const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) throw new Error(`Invalid data URI for image ${index + 1}`);
    return { inlineData: { mimeType: match[1], data: match[2] } };
  }

  // For Lenskart CDN URLs: download server-side and send as inlineData.
  // Gemini's fileData URI only works with gs:// or Files API URIs —
  // arbitrary public HTTPS URLs are NOT supported. We must use inlineData.
  const res = await fetch(img, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LenskartJudge/1.0)' },
  });
  if (!res.ok) throw new Error(`Image fetch failed (${res.status}): ${img.split('/').pop()}`);
  const buffer = await res.arrayBuffer();
  const mimeType = res.headers.get('content-type')?.split(';')[0] || guessMime(img);
  return { inlineData: { mimeType, data: Buffer.from(buffer).toString('base64') } };
}

async function callGemini(apiKey: string, imageParts: unknown[], pid: string, imageCount: number) {
  const contents = [{
    role: 'user' as const,
    parts: [...imageParts, { text: buildJudgeUserPrompt(pid, imageCount) }],
  }];

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: JUDGE_SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(180000),
    }
  );
}

async function judgeWithGemini(pid: string, images: string[], apiKey: string) {
  // Cap at 12 images to reduce token usage on free tier.
  // The scoring framework works well with 8-12 representative images.
  const cappedImages = images.slice(0, 12);

  // Download images in parallel (with a small concurrency cap)
  const CONCURRENCY = 4;
  const imageParts: unknown[] = [];
  for (let i = 0; i < cappedImages.length; i += CONCURRENCY) {
    const batch = cappedImages.slice(i, i + CONCURRENCY);
    const parts = await Promise.all(batch.map((img, j) => buildImagePart(img, i + j)));
    imageParts.push(...parts);
  }

  // Retry with exponential backoff on 429
  const DELAYS = [20000, 40000, 60000, 90000]; // 20s, 40s, 60s, 90s

  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    const res = await callGemini(apiKey, imageParts, pid, cappedImages.length);

    if (res.status === 429) {
      if (attempt < DELAYS.length) {
        const retryAfterHeader = res.headers.get('Retry-After');
        const waitMs = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : DELAYS[attempt];
        console.log(`[judge] PID ${pid} — 429 rate limit, waiting ${waitMs / 1000}s (attempt ${attempt + 1})`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(
        `Gemini free tier quota exhausted after ${DELAYS.length} retries. ` +
        `Wait ~1 minute and try again, or upgrade to a paid Gemini API key for batch analysis.`
      );
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini error (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini — model may have refused the request');

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error('Gemini returned invalid JSON — try again');
    }
  }

  throw new Error('Judge failed after all retries');
}
