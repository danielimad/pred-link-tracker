// app/thanks/page.tsx
export const dynamic = 'force-dynamic';

export default function ThanksPage() {
  const configured = process.env.NEXT_PUBLIC_FALLBACK_URL || '';
  const defaultUrl = 'https://www.whatsapp.com/';

  return (
    <html>
      <body style={{ fontFamily: 'system-ui', padding: 12, lineHeight: 1.4 }}>
        <div id="status">Logging visit…</div>
        <a id="fallbackLink" href="#" style={{ display: 'none' }}>Continue</a>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (async () => {
                const set = (t) => { try { document.getElementById('status').textContent = t; } catch {} };

                // Resolve ID
                const url = new URL(location.href);
                let id = url.searchParams.get('id') || '';
                if (!id) {
                  const seg = url.pathname.split('/').filter(Boolean);
                  if (seg.length === 1) id = seg[0];
                }

                const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
                const ua  = navigator.userAgent || '';
                const ref = document.referrer || '';

                try {
                  await Promise.race([
                    fetch('/api/track', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ id, ua, ref, tz })
                    }),
                    new Promise(r => setTimeout(r, 800))
                  ]);
                  set('Logged. Redirecting…');
                } catch (_) {
                  set('Log failed. Redirecting…');
                }

                // Robust fallback URL
                let fb = ${JSON.stringify(configured)} || ${JSON.stringify(defaultUrl)};
                if (fb && !/^https?:\\/\\//i.test(fb)) fb = 'https://' + fb;

                // Expose manual link
                try {
                  const a = document.getElementById('fallbackLink');
                  a.href = fb; a.style.display = 'inline-block';
                  a.textContent = 'Continue';
                } catch {}

                const go = () => {
                  try { location.replace(fb); } catch (e) {
                    try { location.href = fb; } catch (e2) {}
                  }
                };
                setTimeout(go, 40);
                setTimeout(go, 400);
                setTimeout(go, 1200);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
