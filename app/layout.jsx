import { ClerkProvider } from '@clerk/nextjs';
import './styles.css';
import './globals.css';

export const metadata = {
  title: 'Filra - Film Rating',
  description: 'Jelajahi film, simpan watchlist, dan berbagi rating di Filra.',
};

export default function RootLayout({ children }) {
  const content = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ClerkProvider>{children}</ClerkProvider>
    : children;

  return (
    <html lang="id">
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%231a1428'/%3E%3Cpath d='M12 4l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.5 9.5l5.2-.8z' fill='%23a78bfa'/%3E%3C/svg%3E" />
      </head>
      <body>{content}</body>
    </html>
  );
}
