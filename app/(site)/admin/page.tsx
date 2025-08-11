'use client';

import { useEffect, useMemo, useState } from 'react';
import CopyButton from '../../../components/CopyButton';

export default function AdminPage() {
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState<{ id: string; url: string; label?: string } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [origin, setOrigin] = useState('');

  useEffect(() => { setOrigin(window.location.origin); }, []);

  async function createLink() {
    setError(undefined);
    setResult(null);
    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
        body: JSON.stringify({ label })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setResult(j);
    } catch (e: any) {
      setError(e.message || 'Error');
    }
  }

  const shortUrl = useMemo(() => (result?.id ? `${origin}/${result.id}` : ''), [origin, result?.id]);

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', fontFamily: 'system-ui' }}>
      <div style={{ width: 420, maxWidth: '92vw' }}>
        <h1 style={{ margin: '0 0 10px' }}>Admin — Generate Link</h1>

        <label>Label (optional)</label>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Predator 1" />

        <label style={{ marginTop: 12 }}>Admin Secret</label>
        <input
          value={secret}
          onChange={e => setSecret(e.target.value)}
          placeholder="ADMIN_SECRET"
          type="password"
        />

        <button onClick={createLink} style={{ marginTop: 12 }}>Generate</button>

        {result && (
          <div className="card" style={{ marginTop: 14 }}>
            <div>ID: <b>{result.id}</b></div>
            <div>Path: <code>/{result.id}</code></div>

            <div style={{ marginTop: 10 }}>
              <label>Full URL</label>
              <div className="row" style={{ gridTemplateColumns: '1fr auto auto', gap: 8 }}>
                <input value={shortUrl} readOnly />
                <CopyButton text={shortUrl} />
                <a className="btn ghost" href={shortUrl} target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>

            {result.label ? <div style={{ marginTop: 8 }}>Label: {result.label}</div> : null}
          </div>
        )}

        {error && <p style={{ color: 'crimson', marginTop: 10 }}>{error}</p>}

        <p style={{ opacity: 0.7, marginTop: 16 }}>
          Share only the <b>/{'{id}'}</b> link. Visits log to Google Sheets.
        </p>
      </div>
    </main>
  );
}
