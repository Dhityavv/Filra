'use client';

import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useAccountMount } from './use-account-mount';

export default function ClerkControls() {
  const { isLoaded, userId } = useAuth();
  const mount = useAccountMount();

  useEffect(() => {
    if (!isLoaded) return;
    window.filraAuthState = { isLoaded: true, userId };
    window.dispatchEvent(new CustomEvent('filra:auth', { detail: { userId } }));
  }, [isLoaded, userId]);

  if (!mount) return null;

  return createPortal(
    <div className="account-controls">
      {userId ? (
        <>
          <Link className="btn btn--ghost btn--sm" href="/community">Teman</Link>
          <Link aria-label="Buka profil" className="account-profile-link" href="/account" title="Profil">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
            </svg>
          </Link>
          <UserButton />
        </>
      ) : (
        <SignInButton mode="modal" fallbackRedirectUrl="/community">
          <button className="btn btn--primary btn--sm" type="button">Masuk</button>
        </SignInButton>
      )}
    </div>,
    mount,
  );
}
