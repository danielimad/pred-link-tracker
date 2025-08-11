import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next|api|favicon\\.ico).*)'] };

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname.slice(1);

  // 8-hex id?
  if (/^[0-9a-f]{8}$/i.test(path)) {
    const url = new URL(`/thanks?id=${path}`, req.url);
    const res = NextResponse.redirect(url, { status: 302 });
    // Debug headers (visible with curl -I or browser devtools)
    res.headers.set('x-mw-hit', '1');
    res.headers.set('x-mw-redirect', url.pathname + url.search);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('x-mw-hit', '1');
  return res;
}
