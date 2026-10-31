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
          <Link className="btn btn--ghost btn--sm" href="/account">Profil</Link>
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
