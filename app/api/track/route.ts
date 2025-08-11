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

// Free fallback (no key)
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

function mergeGeo(a: Partial<Geo>, b: Partial<Geo>, c: Partial<Geo>, hdr: Partial<Geo>, ip: string): Geo {
  return {
    ip,
    asn:     a.asn     ?? b.asn     ?? c.asn     ?? hdr.asn,
    org:     a.org     ?? b.org     ?? c.org     ?? hdr.org,
    country: a.country ?? b.country ?? c.country ?? hdr.country,
    region:  a.region  ?? b.region  ?? c.region  ?? hdr.region,
    city:    a.city    ?? b.city    ?? c.city    ?? hdr.city,
    lat:     a.lat     ?? b.lat     ?? c.lat,
    lon:     a.lon     ?? b.lon     ?? c.lon,
    tz:      a.tz      ?? b.tz      ?? c.tz      ?? hdr.tz,
  };
}

export async function POST(req: NextRequest) {
  const scriptBase = process.env.GOOGLE_SCRIPT_BASE;
  if (!scriptBase) return NextResponse.json({ ok: false, error: 'missing-script-base' }, { status: 500 });

  let b: any = {};
  try { b = await req.json(); } catch {}

  const id = String(b.id || b.link_id || '');

  // Real client IP from first XFF element
  const xff = req.headers.get('x-forwarded-for') || '';
  const ipHeader = xff.split(',')[0].trim();
  const ip = ipHeader || '';

  // Vercel header hints as a last resort
  const hdr: Partial<Geo> = {
    ip,
    country: req.headers.get('x-vercel-ip-country') || undefined,
    region:  req.headers.get('x-vercel-ip-country-region') || req.headers.get('x-vercel-ip-region') || undefined,
    city:    req.headers.get('x-vercel-ip-city') || undefined,
    tz:      req.headers.get('x-vercel-ip-timezone') || undefined,
  };

  // Enrich (parallel, tolerate failures)
  const [p1, p2, p3] = await Promise.allSettled([
    ipinfo(ip, process.env.IPINFO_TOKEN),
    ipdata(ip, process.env.IPDATA_KEY),
    ipapi(ip),
  ]);
  const g1 = p1.status === 'fulfilled' ? p1.value : {};
  const g2 = p2.status === 'fulfilled' ? p2.value : {};
  const g3 = p3.status === 'fulfilled' ? p3.value : {};
  const g  = mergeGeo(g1, g2, g3, hdr, ip);

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
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return NextResponse.json({ ok: false, error: 'script-failed', status: resp.status, text }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
