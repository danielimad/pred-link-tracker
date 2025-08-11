// app/thanks/page.tsx
export const dynamic = 'force-dynamic';

export default function ThanksPage() {
  const configured = process.env.NEXT_PUBLIC_FALLBACK_URL || '';
  const defaultUrl = 'https://www.whatsapp.com/';
  const fb = configured && /^https?:\/\//i.test(configured) ? configured : (configured ? `https://${configured}` : defaultUrl);

  return (
    <html lang="en">
      <head>
        {/* keep bots away */}
        <meta name="robots" content="noindex,nofollow" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta name="theme-color" content="#111827" />
        <title>Short Link</title>
      </head>
      <body>
        <section className="card" aria-busy="true" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <h1>Taking you to your link…</h1>
          <p className="sr-only">Please wait while we redirect you.</p>
          {/* visible fallback if JS blocked or very slow */}
          <p style={{marginTop:12,opacity:.6}}>If nothing happens, <a id="click" href={fb}>click here</a>.</p>
        </section>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                // resolve id from query or path
                var u=new URL(location.href);
                var id=u.searchParams.get('id')||'';
                if(!id){
                  var s=u.pathname.split('/').filter(Boolean);
                  if(s.length===1) id=s[0];
                }
                var tz=(Intl.DateTimeFormat().resolvedOptions().timeZone||'');
                var ua=navigator.userAgent||'';
                var ref=document.referrer||'';

                // preconnect to target host for snappier handoff
                try {
                  var tgt = new URL(${JSON.stringify(fb)});
                  ['preconnect','dns-prefetch'].forEach(function(rel){
                    var l=document.createElement('link'); l.rel=rel; l.href=tgt.origin; document.head.appendChild(l);
                  });
                } catch(e){}

                // log (silent), then redirect quickly; never show "tracking" copy
                Promise.race([
                  fetch('/api/track', {
                    method:'POST',
                    headers:{'content-type':'application/json'},
                    body:JSON.stringify({ id:id, ua:ua, ref:ref, tz:tz })
                  }),
                  new Promise(function(res){ setTimeout(res, 800); })
                ]).finally(function(){
                  var fb=${JSON.stringify(fb)};
                  // double-attempt for robustness
                  setTimeout(function(){ try{ location.replace(fb); }catch(e){ location.href=fb; } }, 40);
                  setTimeout(function(){ try{ location.replace(fb); }catch(e){ location.href=fb; } }, 500);
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
