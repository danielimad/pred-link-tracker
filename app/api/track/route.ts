// app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Geo = {
  ip: string; asn?: string; org?: string; country?: string; region?: string; city?: string;
  lat?: number; lon?: number; tz?: string;
};

async function ipinfo(ip: string, token?: string): Promise<Partial<Geo>> {
  if (!token) return {};
  const r = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${token}`, { cache: 'no-store' });
  if (!r.ok) return {};
  const j = await r.json();
  const [lat, lon] = (j.loc?.split(',').map(parseFloat) ?? []);
  return {
    ip,
    asn: j.asn?.asn || j.org?.split(' ')[0],
    org: j.org,
    country: j.country,
    region: j.region,
    city: j.city,
    lat, lon,
    tz: j.timezone
  };
}

async function ipdata(ip: string, key?: string): Promise{Partial<Geo>}> {
  if (!key) return {};
  const r = await fetch(`https://api.ipdata.co/${encodeURIComponent(ip)}?api-key=${key}`, { cache: 'no-store' });
  if (!r.ok) return {};
  const j = await r.json();
  return {
    ip,
    asn: j.asn?.asn || j.asn?.name,
    org: j.asn?.name || j.organisation,
    country: j.country_name || j.country_code,
    region: j.region,
    city: j.city,
    lat: j.latitude, lon: j.longitude,
    tz: j.time_zone?.name || j.time_zone
  };
}

function pick<T>(a: T | undefined, b: T | undefined): T | undefined {
  return a ?? b;
}

function mergeGeo(a: Partial<Geo>, b: Partial<Geo>, ip: string): Geo {
  return {
    ip,
    asn:     pick(a.asn,     b.asn),
    org:     pick(a.org,     b.org),
    country: pick(a.country, b.country),
    region:  pick(a.region,  b.region),
    city:    pick(a.city,    b.city),
    lat:     pick(a.lat,     b.lat),
    lon:     pick(a.lon,     b.lon),
    tz:      pick(a.tz,      b.tz),
  };
}

export async function POST(req: NextRequest) {
  const scriptBase = process.env.GOOGLE_SCRIPT_BASE;
  if (!scriptBase) return NextResponse.json({ ok: false, error: 'missing-script-base' }, { status: 500 });

  let b: any = {};
  try { b = await req.json(); } catch {}
  const id = String(b.id || b.link_id || '');
  const ip = String(b.ip || '');

  // Enrich IP with two providers (parallel)
  const [g1, g2] = await Promise.all([
    ipinfo(ip, process.env.IPINFO_TOKEN).catch(() => ({})),
    ipdata(ip, process.env.IPDATA_KEY).catch(() => ({})),
  ]);

  const g = mergeGeo(g1, g2, ip);

  const payload = {
    id,
    ip,
    ua: String(b.ua || ''),
    ref: String(b.ref || b.referer || ''),
    country: g.country || '',
    region:  g.region  || '',
    city:    g.city    || '',
    asn:     g.asn     || '',
    org:     g.org     || '',
    lat:     typeof g.lat === 'number' ? g.lat : '',
    lon:     typeof g.lon === 'number' ? g.lon : '',
    tz:      g.tz      || '',
  };

  const resp = await fetch(`${scriptBase}?path=visit`, {
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
