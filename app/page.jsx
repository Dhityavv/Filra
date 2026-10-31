import { readFileSync } from 'node:fs';
import path from 'node:path';
import Script from 'next/script';
import AccountControls from '../components/account-controls-server';

export default function HomePage() {
  const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (!match) {
    throw new Error('Markup body Filra tidak ditemukan di index.html.');
  }

  return (
    <>
      <div className="legacy-root" dangerouslySetInnerHTML={{ __html: match[1] }} />
      <AccountControls />
      <Script src="/js/app.js" strategy="afterInteractive" />
    </>
  );
}
