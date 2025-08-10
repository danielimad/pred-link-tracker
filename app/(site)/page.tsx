export default function Page() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', fontFamily: 'system-ui' }}>
      <div>
        <h1 style={{ margin: 0 }}>{process.env.NEXT_PUBLIC_BRAND_TITLE || 'Link'}</h1>
        <p style={{ opacity: 0.7 }}>Ready.</p>
      </div>
    </main>
  );
}
