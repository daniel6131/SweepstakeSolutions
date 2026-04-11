'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  DEV_CONSOLE_COOKIE,
  getDevConsolePasswordHash,
  isDevConsoleEnabled,
  isValidDevConsolePassword,
} from '@/lib/dev-console';

export async function authenticateDevConsole(formData: FormData) {
  if (!isDevConsoleEnabled()) {
    redirect('/');
  }

  const password = String(formData.get('password') ?? '').trim();
  if (!isValidDevConsolePassword(password)) {
    redirect('/dev-console?error=1');
  }

  const passwordHash = getDevConsolePasswordHash();
  const cookieStore = await cookies();

  if (passwordHash) {
    cookieStore.set(DEV_CONSOLE_COOKIE, passwordHash, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/dev-console',
      maxAge: 60 * 60 * 8,
    });
  }

  redirect('/dev-console');
}

export async function logoutDevConsole() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_CONSOLE_COOKIE);
  redirect('/dev-console');
}
