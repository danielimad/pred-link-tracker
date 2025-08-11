// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next|api|favicon\\.ico).*)'] };

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname.slice(1);

  if (/^[0-9a-f]{8}$/i.test(path)) {
    const xff = req.headers.get('x-forwarded-for') || '';
    const ip  = xff.split(',')[0].trim(); // real client IP (best-effort)
    const ua  = req.headers.get('user-agent') || '';
    const ref = req.headers.get('referer') || '';

    // Fire-and-forget server enrichment
    req.waitUntil(fetch(new URL('/api/track', req.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: path, ip, ua, ref }),
      cache: 'no-store'
    }).catch(() => {}));

    // Also serve a page that runs a tiny beacon for device signals
    return NextResponse.rewrite(new URL(`/thanks?id=${path}`, req.url));
  }

  // Ask browser for high-entropy UA-CH on next request
  const res = NextResponse.next();
  res.headers.set('Accept-CH', 'Sec-CH-UA, Sec-CH-UA-Platform, Sec-CH-UA-Model, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List');
  res.headers.set('Permissions-Policy', 'ch-ua=(self), ch-ua-platform=(self), ch-ua-model=(self), ch-ua-platform-version=(self), ch-ua-arch=(self), ch-ua-bitness=(self), ch-ua-full-version-list=(self)');
  return res;
}
