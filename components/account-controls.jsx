'use client';

import { useAuth, useClerk, useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useAccountMount } from './use-account-mount';

export default function ClerkControls() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const mount = useAccountMount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const controlsRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;
    window.filraAuthState = { isLoaded: true, userId };
    window.dispatchEvent(new CustomEvent('filra:auth', { detail: { userId } }));
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function closeOnOutsideClick(event) {
      if (!controlsRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  if (!mount) return null;

  return createPortal(
    <div className="account-controls" ref={controlsRef}>
      {userId ? (
        <>
          <Link className="btn btn--ghost btn--sm" href="/community">Teman</Link>
          <div className="account-menu">
            <button
              aria-expanded={menuOpen}
              aria-controls="filra-account-menu"
              aria-label="Buka menu akun"
              className="account-menu__trigger"
              onClick={() => setMenuOpen((open) => !open)}
              ref={triggerRef}
              type="button"
            >
              <span
                aria-hidden="true"
                className="account-menu__avatar"
                style={{ backgroundImage: user?.imageUrl ? `url("${user.imageUrl}")` : undefined }}
              >
                {!user?.imageUrl ? (user?.fullName || user?.username || 'A').slice(0, 1).toLocaleUpperCase('id-ID') : null}
              </span>
            </button>
            {menuOpen ? (
              <div className="account-menu__popover" id="filra-account-menu">
                <Link
                  className="account-menu__identity"
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                >
                  <span
                    aria-hidden="true"
                    className="account-menu__avatar account-menu__avatar--large"
                    style={{ backgroundImage: user?.imageUrl ? `url("${user.imageUrl}")` : undefined }}
                  >
                    {!user?.imageUrl ? (user?.fullName || user?.username || 'A').slice(0, 1).toLocaleUpperCase('id-ID') : null}
                  </span>
                  <span className="account-menu__identity-copy">
                    <strong>{user?.fullName || user?.username || 'Akun Filra'}</strong>
                    <span>{user?.username ? `@${user.username}` : user?.primaryEmailAddress?.emailAddress || ''}</span>
                  </span>
                </Link>
                <Link className="account-menu__item" href="/account/manage" onClick={() => setMenuOpen(false)}>
                  Manage account
                </Link>
                <button
                  className="account-menu__item"
                  onClick={async () => {
                    setError('');
                    try {
                      await clerk.signOut({ redirectUrl: '/' });
                    } catch (cause) {
                      setError(cause.message || 'Gagal keluar dari akun.');
                    }
                  }}
                  type="button"
                >
                  Sign out
                </button>
                {error ? <p className="account-menu__error" role="alert">{error}</p> : null}
              </div>
            ) : null}
          </div>
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
