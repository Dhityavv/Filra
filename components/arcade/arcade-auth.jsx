'use client';

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function ArcadeAuth() {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return <span className="arcade-account-note">Memuat akun...</span>;
  if (!userId) {
    return (
      <SignInButton mode="modal" fallbackRedirectUrl="/minigames">
        <button className="arcade-signin" type="button">Masuk untuk menyimpan XP</button>
      </SignInButton>
    );
  }
  return (
    <div className="arcade-account">
      <Link href="/account">Profil Filra</Link>
      <UserButton />
    </div>
  );
}
