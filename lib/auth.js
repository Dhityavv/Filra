import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';

export async function getCurrentIdentity() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return {
      error: Response.json({ error: 'Login belum dikonfigurasi di server.' }, { status: 503 }),
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      error: Response.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 }),
    };
  }

  return { userId };
}

export async function getClerkUser() {
  const user = await currentUser();
  if (!user) return null;

  return {
    userId: user.id,
    name: user.fullName || user.firstName || '',
    username: user.username || '',
    email: user.primaryEmailAddress?.emailAddress || '',
    imageUrl: user.imageUrl || '',
  };
}

export async function getClerkUserImageUrl(userId) {
  if (!process.env.CLERK_SECRET_KEY) return '';
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    return user.imageUrl || '';
  } catch (error) {
    console.error('Failed to load Clerk profile image:', error);
    return '';
  }
}
