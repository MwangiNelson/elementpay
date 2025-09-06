import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { toast } from 'sonner';

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    // This will trigger Clerk's middleware to redirect
    // We'll handle the toast on the client side
    redirect('/');
  }

  return userId;
}

export function showAuthRequiredToast() {
  toast.error('Authentication Required', {
    description: 'Please sign in to access this page.',
    duration: 4000,
  });
}
