export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

function randomId(len = 6) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function POST(req: NextRequest) {
  const auth =req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.ADMIN_SECRET}`;
  if (!process.env.ADMIN_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = (body.id as string) || randomId();
  const label = (body.label as string) || null;

  const scriptBase = process.env.GOOGLE_SCRIPT_BASE;
  if (!scriptBase) {
    return NextResponse.json({ error: 'Missing GOOGLE_SCRIPT_BASE' }, { status: 500 });
  }

  const resp = await fetch(`${scriptBase}?path=link`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, label })
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => 'Sheets error');
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({ id, url: `/${id}`, label }, { status: 201 });
}`
