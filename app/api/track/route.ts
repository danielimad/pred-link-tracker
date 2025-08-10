export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

// Type for IP geolocation result
interface GeoResult {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  asn?: string;
  org?: string;
  raw?: any;
}

// Extract client IP from headers
function extractIp(headers: Headers): string | undefined {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const ip = xff.split(',')[0].trim();
    if (ip) return ip;
  }
  const xr = headers.get('x-real-ip');
  if (xr) return xr.trim();
  return undefined;
}

// Lookup geolocation using ipapi.co
async function ipLookup(ip: string | undefined): Promise<GeoResult> {
  if (!ip) return {};
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { cache: 'no-store' });
    if (!res.ok) return {};
    const j = await res.json();
    return {
      ip,
      country: j.country_name,
      region: j.region,
      city: j.city,
      latitude: j.latitude,
      longitude: j.longitude,
      asn: j.asn,
      org: j.org || j.org_name || j.company,
      raw: j
    };
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const headers = req.headers;
    const url = new URL(req.url);
    const pathname = headers.get('x-pathname') || url.pathname;
    const linkId = pathname.replace('/', '');

    const ip = extractIp(headers);
    const ua = headers.get('user-agent') || '';
    const referer = headers.get('referer') || '';

    const geo = await ipLookup(ip);

    // Post to Google Script
    const scriptBase = process.env.GOOGLE_SCRIPT_BASE!;
    if (scriptBase) {
      await fetch(`${scriptBase}?path=visit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          link_id: linkId,
          ip: ip ?? '',
          ua,
          referer,
          country: geo.country ?? '',
          region: geo.region ?? '',
          city: geo.city ?? '',
          lat: geo.latitude ?? '',
          lon: geo.longitude ?? '',
          asn: geo.asn ?? '',
          org: geo.org ?? '',
          raw: geo.raw ?? {}
        })
      }).catch(() => {});
    }

    // Telegram alert (optional)
    const bot = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (bot && chat) {
      const text =
        `🔔 Link visited\n` +
        `ID: ${linkId}\n` +
        (ip ? `IP: ${ip}\n` : '') +
        ((geo.city || geo.country) ? `Geo: ${geo.city ?? ''} ${geo.country ?? ''}\n` : '') +
        (ua ? `UA: ${ua.substring(0, 160)}\n` : '') +
        (referer ? `Ref: ${referer}\n` : '') +
        `Time: ${new Date().toLocaleString()}`;
      await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text })
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
