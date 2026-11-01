'use client';

import { useClerk } from '@clerk/nextjs';

export default function AccountSecurity() {
  const clerk = useClerk();

  return (
    <section className="community-card account-security">
      <div>
        <h2>Login dan keamanan</h2>
        <p className="community-muted">Kelola email, kata sandi, dan metode masuk akunmu.</p>
      </div>
      <button className="btn btn--ghost" onClick={() => clerk.openUserProfile()} type="button">Kelola akun Clerk</button>
    </section>
  );
}
