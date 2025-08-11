// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next|api|favicon\\.ico).*)'] };

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname.slice(1);

  // If the path is exactly an 8-hex ID, redirect to the logger page
  if (/^[0-9a-f]{8}$/i.test(path)) {
    // Internal redirect to our logger page so we can run the beacon
    return NextResponse.redirect(new URL(`/thanks?id=${path}`, req.url));
  }

  return NextResponse.next();
}
