export default function ThanksPage() {
  return (
    <html>
      <body>
        <p>OK</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (async () => {
              try {
                const params = new URLSearchParams(location.search);
                const id = params.get('id') || '';

                // Client signals
                const nav = navigator;
                const dpr = window.devicePixelRatio || 1;
                const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
                const lang= (nav.languages && nav.languages[0]) || nav.language || '';
                const scr = { w: screen.width, h: screen.height, aw: innerWidth, ah: innerHeight, dpr };
                const mem = nav.deviceMemory || null;
                const cores = nav.hardwareConcurrency || null;
                const conn = nav.connection ? {
                  type: nav.connection.type || '',
                  effectiveType: nav.connection.effectiveType || '',
                  rtt: nav.connection.rtt || null,
                  downlink: nav.connection.downlink || null
                } : null;

                let ua = nav.userAgent || '';
                let uaBrands = '', uaPlatform = '', uaModel = '', uaFull = '';
                try {
                  if (nav.userAgentData) {
                    const h = await nav.userAgentData.getHighEntropyValues(
                      ['platform','platformVersion','model','architecture','bitness','fullVersionList']
                    );
                    uaPlatform = h.platform + ' ' + (h.platformVersion||'');
                    uaModel = h.model||'';
                    uaFull = (h.fullVersionList||[]).map(x => x.brand + '/' + x.version).join(', ');
                    uaBrands = (nav.userAgentData.brands||[]).map(x => x.brand + '/' + x.version).join(', ');
                  }
                } catch {}

                // 1) Server-side IP+geo enrichment + basic UA/ref
                await fetch('/api/track', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    id,
                    ua,
                    ref: document.referrer || ''
                  })
                });

                // 2) Optional: detailed client meta (stored in Sheet3)
                await fetch('/api/client-meta', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    id, tz, lang, scr, mem, cores, conn, uaBrands, uaPlatform, uaModel, uaFull
                  })
                });
              } catch (_) {}
            })();
          `,
          }}
        />
      </body>
    </html>
  );
}
