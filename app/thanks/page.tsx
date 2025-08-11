// app/thanks/page.tsx
export const dynamic = 'force-dynamic'; // ensure not prerendered/cached

export default function ThanksPage() {
  return (
    <html>
      <body>
        <p>OK</p>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (async () => {
                const url = new URL(location.href);
                let id = url.searchParams.get('id') || '';

                // Fallback: if someone hits /{id} directly without ?id= (shouldn't, because we redirect),
                // try to parse from the path.
                if (!id) {
                  const seg = url.pathname.split('/').filter(Boolean);
                  if (seg.length === 1 && /^[0-9a-f]{8}$/i.test(seg[0])) id = seg[0];
                }

                const ua  = navigator.userAgent || '';
                const ref = document.referrer || '';
                const fallback = ${JSON.stringify(process.env.NEXT_PUBLIC_FALLBACK_URL || '')};

                try {
                  // Don’t block UX: either log successfully or time out after 600ms
                  await Promise.race([
                    fetch('/api/track', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ id, ua, ref })
                    }),
                    new Promise(resolve => setTimeout(resolve, 600))
                  ]);
                } catch (e) {
                  // swallow
                }

                if (fallback) location.replace(fallback);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
