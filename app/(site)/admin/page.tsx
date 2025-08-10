'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState<{ id: string; url: string; label?: string } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  async function createLink() {
    setError(undefined);
    setResult(null);
    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${secret}`
        },
        body: JSON.stringify({ label })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setResult(j);
    } catch (e: any) {
      setError(e.message || 'Error');
    }
  }

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', fontFamily: 'system-ui' }}>
      <div style={{ width: 360, maxWidth: '90vw' }}>
        <h1>Admin — Generate Link</h1>
        <label>Label (optional)</label>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Predator 1" />
        <label style={{ marginTop: 12 }}>Admin Secret</label>
        <input
          value={secret}
          onChange={e => setSecret(e.target.value)}
          placeholder="ADMIN_SECRET"
          type="password"
        />
        <button onClick={createLink} style={{ marginTop: 12 }}>
          Generate
        </button>
        {result && (
          <div className="card">
            <div>
              ID: <b>{result.id}</b>
            </div>
            <div>
              Path: <code>/{result.id}</code>
            </div>
            <div>
              Full URL: <code>{typeof window !== 'undefined' ? window.location.origin : ''}/{result.id}</code>
            </div>
            {result.label ? <div>Label: {result.label}</div> : null}
          </div>
        )}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <p style={{ opacity: 0.7, marginTop: 16 }}>
          Share only the <b>/{'{id}'}</b> link. Visits log to Google Sheets + optional Telegram alert.
        </p>
      </div>
    </main>
  );
}
