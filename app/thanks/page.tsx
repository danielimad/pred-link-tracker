export const dynamic = 'force-dynamic';

export default function ThanksPage() {
  const configured = process.env.NEXT_PUBLIC_FALLBACK_URL || '';
  const defaultUrl = 'https://www.whatsapp.com/';
  const fb =
    configured && /^https?:\/\//i.test(configured)
      ? configured
      : configured
      ? `https://${configured}`
      : defaultUrl;

  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Short Link</title>
        <style>{`
          :root { color-scheme: dark; }
          * { box-sizing: border-box; }
          html, body { margin: 0; height: 100%; }
          body {
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
            background: #0b0c10; color: #e5e7eb;
            display: grid; place-items: center; padding: 0;
          }
          /* Card defaults (desktop/tablet) */
          .card {
            width: min(640px, 92vw);
            background: #0f172a;
            border: 1px solid rgba(255,255,255,.06);
            border-radius: 16px;
            padding: clamp(20px, 3vw, 28px);
            box-shadow: 0 10px 40px rgba(0,0,0,.35);
          }
          /* Mobile: fill screen with 25px margin and center content perfectly */
          @media (max-width: 640px) {
            body { padding: 25px; }
            .card {
              width: 100%;
              height: calc(100dvh - 50px);
              display: flex; flex-direction: column;
              justify-content: center; align-items: flex-start;
            }
          }
          h1 { margin: 0 0 6px; font-size: clamp(16px, 2.2vw, 20px); font-weight: 650; letter-spacing: .2px; }
          p { margin: 0; font-size: 14px; opacity: .7; }
          .row { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; }

          .spinner {
            width: 28px; height: 28px; border-radius: 50%;
            border: 3px solid rgba(255,255,255,.15);
            border-top-color: #22c55e;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </head>
      <body>
        <section className="card" aria-live="polite" aria-busy="true">
          <div className="row">
            <div className="spinner" aria-hidden="true" />
            <div>
              <h1>Taking you to your link…</h1>
              <p>If nothing happens, <a id="manual" href={fb}>click here</a>.</p>
            </div>
          </div>
        </section>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var u = new URL(location.href);
                var id = u.searchParams.get('id') || '';
                if(!id){
                  var s = u.pathname.split('/').filter(Boolean);
                  if(s.length===1) id = s[0];
                }
                var tz  = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
                var ua  = navigator.userAgent || '';
                var ref = document.referrer || '';

                // preconnect for snappier handoff
                try {
                  var tgt = new URL(${JSON.stringify(fb)});
                  ['preconnect','dns-prefetch'].forEach(function(rel){
                    var l=document.createElement('link'); l.rel=rel; l.href=tgt.origin; document.head.appendChild(l);
                  });
                } catch(e){}

                Promise.race([
                  fetch('/api/track', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ id, ua, ref, tz })
                  }),
                  new Promise(function(r){ setTimeout(r, 800); })
                ]).finally(function(){
                  var fb = ${JSON.stringify(fb)};
                  var go = function(){ try{ location.replace(fb); }catch(e){ location.href = fb; } };
                  setTimeout(go, 40);
                  setTimeout(go, 380);
                  setTimeout(go, 1100);
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
