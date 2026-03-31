import { NextRequest, NextResponse } from 'next/server';

interface GalleryItem {
  type: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

async function scrapeProductImages(pid: string): Promise<string[]> {
  const res = await fetch(`https://www.lenskart.com/product/${pid}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`Lenskart returned ${res.status}`);
  const html = await res.text();

  // Extract __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!nextDataMatch) throw new Error('Could not find product data');

  const data = JSON.parse(nextDataMatch[1]);

  // Navigate to galleryWidget: pageProps > data > productDetailData > result (array of widgets)
  const widgets = data.props?.pageProps?.data?.productDetailData?.result;
  if (!Array.isArray(widgets)) throw new Error('Unexpected page structure');

  const gallery = widgets.find((w: { id: string }) => w.id === 'gallery');
  if (!gallery?.data?.galleryWidget?.data) throw new Error('Gallery widget not found');

  // Extract the product model number for filtering (e.g. "vc-e11797-c3")
  const modelNo: string = gallery.data.modelName || gallery.data.brandName || '';
  const modelSlug = modelNo.toLowerCase().replace(/\s+/g, '-');

  const galleryItems: GalleryItem[] = gallery.data.galleryWidget.data;
  const images: string[] = [];

  for (const item of galleryItems) {
    const url = item.type === 'IMAGE' ? item.imageUrl : item.type === 'VIDEO' ? item.thumbnailUrl : undefined;
    if (!url) continue;

    // Filter out generic marketing/promo images that don't belong to this product.
    // Product images contain the PID or model slug in their URL filename.
    // Marketing images reference other product models or generic assets.
    const filename = url.split('/').pop()?.toLowerCase() || '';
    const isProductImage =
      filename.includes(pid) ||
      (modelSlug && filename.includes(modelSlug)) ||
      filename.includes(`_g_`) ||
      url.includes(`pdp-video-${pid}`);

    if (isProductImage) {
      images.push(url);
    }
  }

  return images;
}

export async function GET(request: NextRequest) {
  const pid = request.nextUrl.searchParams.get('pid');
  if (!pid || !/^\d+$/.test(pid)) {
    return NextResponse.json({ error: 'Invalid PID. Must be numeric.' }, { status: 400 });
  }

  try {
    const images = await scrapeProductImages(pid);

    if (images.length === 0) {
      return NextResponse.json({
        error: 'No product images found. Try manual URL paste.',
        pid,
      }, { status: 404 });
    }

    return NextResponse.json({ pid, images, count: images.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scraping failed';
    return NextResponse.json({ error: message, pid }, { status: 500 });
  }
}
