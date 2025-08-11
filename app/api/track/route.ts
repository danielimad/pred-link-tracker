// app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Geo = {
  ip: string;
  asn?: string;
  org?: string;
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  tz?: string;
};

async function ipinfo(ip: string, token?: string): Promise<Partial<Geo>> {
  if (!token || !ip) return {};
  const r = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${token}`, { cache: 'no-store' });
  if (!r.ok) return {};
  const j: any = await r.json();
  const [latStr, lonStr] = typeof j.loc === 'string' ? j.loc.split(',') : [];
  const lat = latStr ? parseFloat(latStr) : undefined;
  const lon = lonStr ? parseFloat(lonStr) : undefined;
  return {
    ip,
    asn: j.asn?.asn || (typeof j.org === 'string' ? j.org.split(' ')[0] : undefined),
    org: j.org,
    country: j.country,
    region: j.region,
    city: j.city,
    lat: Number.isFinite(lat) ? lat : undefined,
    lon: Number.isFinite(lon) ? lon : undefined,
    tz: j.timezone,
  };
}

async function ipdata(ip: string, key?: string): Promise<Partial<Geo>> {
  if (!key || !ip) return {};
  const r = await fetch(`https://api.ipdata.co/${encodeURIComponent(ip)}?api-key=${key}`, { cache: 'no-store' });
  if (!r.ok) return {};
  const j: any = await r.json();
  return {
    ip,
    asn: j.asn?.asn || j.asn?.name,
    org: j.asn?.name || j.organisation,
    country: j.country_name || j.country_code,
    region: j.region,
    city: j.city,
    lat: typeof j.latitude === 'number' ? j.latitude : undefined,
    lon: typeof j.longitude === 'number' ? j.longitude : undefined,
    tz: j.time_zone?.name || j.time_zone,
  };
}

// Free passive IP geo (no key)
async function ipapi(ip: string): Promise<Partial<Geo>> {
  if (!ip) return {};
  const r = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { cache: 'no-store' });
  if (!r.ok) return {};
  const j: any = await r.json();
  return {
    ip,
    asn: j.asn,
    org: j.org || j.orgname || j.org_name,
    country: j.country_name || j.country,
    region: j.region || j.region_code,
    city: j.city,
    lat: typeof j.latitude === 'number' ? j.latitude : parseFloat(j.latitude),
    lon: typeof j.longitude === 'number' ? j.longitude : parseFloat(j.longitude),
    tz: j.timezone,
  };
}

// Another free passive IP geo (no key)
async function ipwho(ip: string): Promise<Partial<Geo>> {
  if (!ip) return {};
  const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?output=json`, { cache: 'no-store' });
  if (!r.ok) return {};
  const j: any = await r.json();
  return {
    ip,
    asn: j.connection?.asn,
    org: j.connection?.org,
    country: j.country || j.country_code,
    region:  j.region,
    city:    j.city,
    lat: typeof j.latitude === 'number' ? j.latitude : undefined,
    lon: typeof j.longitude === 'number' ? j.longitude : undefined,
    tz:  j.timezone?.id || j.timezone,
  };
}

function best<T>(...vals: (T | undefined)[]): T | undefined {
  for (const v of vals) { if (v !== undefined && v !== null && (typeof v !== 'string' || v.trim())) return v; }
  return undefined;
}

export async function POST(req: NextRequest) {
  const scriptBase = process.env.GOOGLE_SCRIPT_BASE;
  if (!scriptBase) return NextResponse.json({ ok: false, error: 'missing-script-base' }, { status: 500 });

  let b: any = {};
  try { b = await req.json(); } catch {}

  const id = String(b.id || b.link_id || '');

  // Client IP (first XFF element)
  const xff = req.headers.get('x-forwarded-for') || '';
  const ipHeader = xff.split(',')[0].trim();
  const ip = ipHeader || '';

  // Vercel hints (cheap & always present)
  const hdr = {
    country: req.headers.get('x-vercel-ip-country') || undefined,
    region:  req.headers.get('x-vercel-ip-country-region') || req.headers.get('x-vercel-ip-region') || undefined,
    city:    req.headers.get('x-vercel-ip-city') || undefined,
    tz:      req.headers.get('x-vercel-ip-timezone') || undefined,
  };

  // Query providers in parallel (tolerant)
  const [p1, p2, p3, p4] = await Promise.allSettled([
    ipinfo(ip, process.env.IPINFO_TOKEN),
    ipdata(ip, process.env.IPDATA_KEY),
    ipapi(ip),
    ipwho(ip),
  ]);

  const g1 = p1.status === 'fulfilled' ? p1.value : {};
  const g2 = p2.status === 'fulfilled' ? p2.value : {};
  const g3 = p3.status === 'fulfilled' ? p3.value : {};
  const g4 = p4.status === 'fulfilled' ? p4.value : {};

  const lat = best(g1.lat, g2.lat, g3.lat, g4.lat);
  const lon = best(g1.lon, g2.lon, g3.lon, g4.lon);

  const payload = {
    id,
    ip,
    ua: String(b.ua || ''),
    ref: String(b.ref || b.referer || ''),

    country: best(g1.country, g2.country, g3.country, g4.country, hdr.country) || '',
    region:  best(g1.region,  g2.region,  g3.region,  g4.region,  hdr.region)  || '',
    city:    best(g1.city,    g2.city,    g3.city,    g4.city,    hdr.city)    || '',
    asn:     best(g1.asn,     g2.asn,     g3.asn,     g4.asn)                 || '',
    org:     best(g1.org,     g2.org,     g3.org,     g4.org)                 || '',
    lat:     typeof lat === 'number' ? lat : '',
    lon:     typeof lon === 'number' ? lon : '',
    tz:      String(b.tz || best(g1.tz, g2.tz, g3.tz, g4.tz, hdr.tz) || ''),
  };

  const resp = await fetch(`${scriptBase}?path=visit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return NextResponse.json({ ok: false, error: 'script-failed', status: resp.status, text }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
