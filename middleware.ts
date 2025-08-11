import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next|api|favicon\\.ico).*)'] };

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname.slice(1);

  if (/^[0-9a-f]{8}$/i.test(path)) {
    // Add UA-CH hints for the next request(s)
    const res = NextResponse.rewrite(new URL(`/thanks?id=${path}`, req.url));
    res.headers.set('Accept-CH',
      'Sec-CH-UA, Sec-CH-UA-Platform, Sec-CH-UA-Model, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List'
    );
    res.headers.set('Permissions-Policy',
      'ch-ua=(self), ch-ua-platform=(self), ch-ua-model=(self), ch-ua-platform-version=(self), ch-ua-arch=(self), ch-ua-bitness=(self), ch-ua-full-version-list=(self)'
    );
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('Accept-CH',
    'Sec-CH-UA, Sec-CH-UA-Platform, Sec-CH-UA-Model, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List'
  );
  res.headers.set('Permissions-Policy',
    'ch-ua=(self), ch-ua-platform=(self), ch-ua-model=(self), ch-ua-platform-version=(self), ch-ua-arch=(self), ch-ua-bitness=(self), ch-ua-full-version-list=(self)'
  );
  return res;
}
