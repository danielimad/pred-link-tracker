// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next|api|favicon\\.ico).*)'] };

export function middleware(req: NextRequest) {
  const id = req.nextUrl.pathname.slice(1);
  if (/^[0-9a-f]{8}$/i.test(id)) {
    const url = new URL(`/thanks?id=${id}`, req.url);
    const res = NextResponse.redirect(url, { status: 302 });
    res.headers.set('x-mw', 'hit');
    res.headers.set('x-mw-location', url.pathname + url.search);
    return res;
  }
  const res = NextResponse.next();
  res.headers.set('x-mw', 'hit');
  return res;
}
