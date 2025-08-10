import '../styles/globals.css';
import React from 'react';

export const metadata = {
  title: process.env.NEXT_PUBLIC_BRAND_TITLE || 'Link',
  description: 'Loading…'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
