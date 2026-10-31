'use client';

import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useAccountMount } from './use-account-mount';

export default function GuestControls() {
  const mount = useAccountMount();

  useEffect(() => {
    window.filraAuthState = { isLoaded: true, userId: null };
    window.dispatchEvent(new CustomEvent('filra:auth', { detail: { userId: null } }));
  }, []);

  if (!mount) return null;

  return createPortal(
    <div className="account-controls">
      <span className="account-setup-note">Login belum dikonfigurasi</span>
    </div>,
    mount,
  );
}
