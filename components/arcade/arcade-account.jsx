import ArcadeAuth from './arcade-auth';

export default function ArcadeAccount() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ArcadeAuth />
    : <span className="arcade-account-note">Mode tamu</span>;
}
