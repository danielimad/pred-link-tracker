// app/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id || '';
  // validate 8‑hex IDs
  if (!/^[0-9a-f]{8}$/i.test(id)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  // always go to /thanks first
  return NextResponse.redirect(new URL(`/thanks?id=${id}`, req.url), { status: 302 });
}
