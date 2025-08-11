// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Short Link',
  description: 'Fast, simple URL redirects.',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#111827',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
