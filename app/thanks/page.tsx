// app/thanks/page.tsx
export const dynamic = 'force-dynamic';

export default function ThanksPage() {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui', padding: 12 }}>
        <div id="status">Logging visit…</div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (async () => {
                const set = (t) => { try { document.getElementById('status').textContent = t; } catch {} };
                const url = new URL(location.href);
                let id = url.searchParams.get('id') || '';
                if (!id) {
                  const seg = url.pathname.split('/').filter(Boolean);
                  if (seg.length === 1 && /^[0-9a-f]{8}$/i.test(seg[0])) id = seg[0];
                }
                try {
                  await Promise.race([
                    fetch('/api/track', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        id,
                        ua: navigator.userAgent || '',
                        ref: document.referrer || ''
                      })
                    }),
                    new Promise(r => setTimeout(r, 700))
                  ]);
                  set('Logged. Redirecting…');
                } catch (_) {
                  set('Log failed. Redirecting…');
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
