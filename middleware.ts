// middleware.ts (optional safety net)
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ID_OK = /^[A-Za-z0-9_-]{3,32}$/;

export const config = { matcher: ['/((?!_next|api|favicon\\.ico).*)'] };

export function middleware(req: NextRequest) {
  const slug = req.nextUrl.pathname.slice(1);
  if (ID_OK.test(slug)) {
    return NextResponse.redirect(new URL(`/thanks?id=${slug}`, req.url), { status: 302 });
  }
  return NextResponse.next();
}
