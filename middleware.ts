import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Configure middleware to run on all paths except internal assets and api routes
export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)']
};

// Edge middleware: triggers tracking API for any single-segment path like /abcd
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Check that the request path is a single segment (e.g. "/abcd")
  const isSingleSegment =
    pathname !== '/' &&
    pathname.split('/').filter(Boolean).length === 1;

  if (isSingleSegment) {
    // Fire-and-forget fetch to our tracking endpoint. Use AbortController
    // so the request won't block page rendering.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    try {
      await fetch(new URL('/api/track', req.url), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Pass the original pathname via header so the API knows which link ID
          'x-pathname': pathname
        },
        body: JSON.stringify({}),
        signal: controller.signal,
        cache: 'no-store'
      }).catch(() => {});
    } finally {
      clearTimeout(timeout);
    }
  }
  return NextResponse.next();
}
