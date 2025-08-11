// app/thanks/page.tsx
export const dynamic = 'force-dynamic';

export default function ThanksPage() {
  const configured = process.env.NEXT_PUBLIC_FALLBACK_URL || '';
  const defaultUrl = 'https://www.whatsapp.com/';
  // robust target (accepts values without protocol)
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
      </head>
      <body>
        <section className="card redirect">
          <div className="row-flex">
            <div className="spinner" aria-hidden="true" />
            <div>
              <h1>Taking you to your link…</h1>
              <p className="muted">If nothing happens, <a id="manual" href={fb}>click here</a>.</p>
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
