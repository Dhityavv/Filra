'use client';

import Link from 'next/link';

export default function DocumentLink({ href, ...props }) {
  return (
    <Link
      href={href}
      {...props}
      onNavigate={(event) => {
        event.preventDefault();
        window.location.assign(new URL(href, window.location.href).href);
      }}
    />
  );
}
