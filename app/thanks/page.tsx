// app/thanks/page.tsx
export const dynamic = 'force-dynamic';

export default function ThanksPage() {
  // The env is inlined at build time. We also add a safe default.
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

                // Determine ID
                const url = new URL(location.href);
                let id = url.searchParams.get('id') || '';
                if (!id) {
                  const seg = url.pathname.split('/').filter(Boolean);
                  if (seg.length === 1) id = seg[0];
                }

                // Track
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
                } catch (_) {}

                // Build fallback URL robustly
                let fb = ${JSON.stringify(configured)} || ${JSON.stringify(defaultUrl)};
                // If someone set "whatsapp.com" without protocol → fix it
                if (fb && !/^https?:\\/\\//i.test(fb)) fb = 'https://' + fb;

                // Expose manual link
                try {
                  const a = document.getElementById('fallbackLink');
                  a.href = fb;
                  a.style.display = 'inline-block';
                  a.textContent = 'Continue to WhatsApp';
                } catch {}

                set('Logged. Redirecting…');

                const go = () => {
                  try { location.replace(fb); } catch (e) {
                    try { location.href = fb; } catch (e2) {}
                  }
                };

                // Multiple attempts to dodge any transient blockers
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
