import { NextRequest, NextResponse } from 'next/server';

const LENSKART_API_ENDPOINTS = [
  (pid: string) => `https://api-gateway.lenskart.com/v2/products/details/${pid}`,
  (pid: string) => `https://api-gateway.lenskart.com/v2/products/${pid}`,
];

const IMAGE_URL_PATTERN = /https?:\/\/static\d?\.lenskart\.com\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi;

async function tryLenskartAPI(pid: string): Promise<string[]> {
  for (const buildUrl of LENSKART_API_ENDPOINTS) {
    try {
      const url = buildUrl(pid);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const images = extractImagesFromJSON(data);
      if (images.length > 0) return images;
    } catch {
      continue;
    }
  }
  return [];
}

function extractImagesFromJSON(obj: unknown, depth = 0): string[] {
  if (depth > 10) return [];
  const urls = new Set<string>();

  if (typeof obj === 'string') {
    const matches = obj.match(IMAGE_URL_PATTERN);
    if (matches) matches.forEach(u => urls.add(u));
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractImagesFromJSON(item, depth + 1).forEach(u => urls.add(u)));
  } else if (obj && typeof obj === 'object') {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      extractImagesFromJSON(val, depth + 1).forEach(u => urls.add(u));
    }
  }
  return [...urls];
}

async function tryProductPage(pid: string): Promise<string[]> {
  try {
    const res = await fetch(`https://www.lenskart.com/product/${pid}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    // Extract from __NEXT_DATA__ JSON
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const data = JSON.parse(nextDataMatch[1]);
      const images = extractImagesFromJSON(data);
      if (images.length > 0) return images;
    }

    // Fallback: regex scan entire HTML
    const matches = html.match(IMAGE_URL_PATTERN);
    if (matches) return [...new Set(matches)];
  } catch {
    // ignore
  }
  return [];
}

export async function GET(request: NextRequest) {
  const pid = request.nextUrl.searchParams.get('pid');
  if (!pid || !/^\d+$/.test(pid)) {
    return NextResponse.json({ error: 'Invalid PID. Must be numeric.' }, { status: 400 });
  }

  // Strategy 1: Lenskart API
  let images = await tryLenskartAPI(pid);

  // Strategy 2: Product page scrape
  if (images.length === 0) {
    images = await tryProductPage(pid);
  }

  // Filter to unique, high-quality images (skip tiny thumbnails)
  const filtered = [...new Set(images)].filter(url => {
    const lower = url.toLowerCase();
    return !lower.includes('/thumbnail/50x') &&
           !lower.includes('/thumbnail/80x') &&
           !lower.includes('/small_image/');
  });

  if (filtered.length === 0) {
    return NextResponse.json({
      error: 'No images found. Use manual URL paste instead.',
      pid,
      strategies_tried: ['lenskart-api', 'product-page'],
    }, { status: 404 });
  }

  return NextResponse.json({ pid, images: filtered, count: filtered.length });
}
