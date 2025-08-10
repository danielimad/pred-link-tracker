'use client';

import { useEffect } from 'react';

export default function LinkPage() {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_FALLBACK_REDIRECT || 'https://www.whatsapp.com/';
    const t = setTimeout(() => {
      try { window.location.replace(url); } catch { window.location.href = url; }
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{display:'grid',placeItems:'center',minHeight:'100dvh',fontFamily:'system-ui',background:'#f5f5f5'}}>
      <div style={{textAlign:'center'}}>
        <div className="spinner" />
        <h1 style={{marginTop:16}}>{process.env.NEXT_PUBLIC_BRAND_TITLE || 'Loading…'}</h1>
        <p style={{opacity:0.7}}>Please wait…</p>
      </div>
    </main>
  );
}
