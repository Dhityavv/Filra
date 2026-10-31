import ClerkControls from './account-controls';
import GuestControls from './guest-controls';

export default function AccountControls() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ClerkControls />
    : <GuestControls />;
}
