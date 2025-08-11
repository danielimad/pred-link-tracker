export const dynamic = 'force-dynamic';

export default function ThanksPage() {
  const fallback = process.env.NEXT_PUBLIC_FALLBACK_URL || ''; // must be NEXT_PUBLIC_*

  return (
    <html>
      <body style={{ fontFamily: 'system-ui', padding: 12 }}>
        <div id="status">Loading…</div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (async () => {
                const status = (t) => { try { document.getElementById('status').textContent = t; } catch {} };
                try {
                  const url = new URL(location.href);
                  let id = url.searchParams.get('id') || '';
                  if (!id) {
                    const seg = url.pathname.split('/').filter(Boolean);
                    if (seg.length === 1 && /^[0-9a-f]{8}$/i.test(seg[0])) id = seg[0];
                  }
                  status('Tracking visit for ' + id + ' …');

                  await Promise.race([
                    fetch('/api/track', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ id, ua: navigator.userAgent || '', ref: document.referrer || '' })
                    }),
                    new Promise(res => setTimeout(res, 600))
                  ]);

                  status('Done. Redirecting…');
                } catch (e) {
                  status('Tracking failed. Redirecting…');
                }
                const fb = ${JSON.stringify(process.env.NEXT_PUBLIC_FALLBACK_URL || '')};
                if (fb) location.replace(fb);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
