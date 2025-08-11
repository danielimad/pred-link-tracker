// app/api/client-meta/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const scriptBase = process.env.GOOGLE_SCRIPT_BASE;
  if (!scriptBase) return NextResponse.json({ ok: false, error: 'missing-script-base' }, { status: 500 });
  let b: any = {}; try { b = await req.json(); } catch {}

  // Flatten a few nested fields for the sheet
  const payload = {
    id: String(b.id || ''),
    tz: String(b.tz || ''),
    lang: String(b.lang || ''),
    scr: JSON.stringify(b.scr || {}),
    mem: (b.mem ?? '').toString(),
    cores: (b.cores ?? '').toString(),
    conn: JSON.stringify(b.conn || {}),
    uaBrands: String(b.uaBrands || ''),
    uaPlatform: String(b.uaPlatform || ''),
    uaModel: String(b.uaModel || ''),
    uaFull: String(b.uaFull || '')
  };

  // Reuse visit path with a “client” marker OR add a new path in Apps Script
  const resp = await fetch(`${scriptBase}?path=client`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return NextResponse.json({ ok: false, error: 'script-failed', status: resp.status, text }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
