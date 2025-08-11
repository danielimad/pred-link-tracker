// app/[id]/route.ts  (FINAL)
import { NextRequest, NextResponse } from 'next/server';

const ID_OK = /^[A-Za-z0-9_-]{3,32}$/; // accepts your current IDs like "p65p1hx"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id || '';
  if (!ID_OK.test(id)) return new NextResponse('Not Found', { status: 404 });
  return NextResponse.redirect(new URL(`/thanks?id=${id}`, req.url), { status: 302 });
}
