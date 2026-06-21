'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { recordAudit } from '@/lib/audit-log';
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
  const ok = isValidDevConsolePassword(password);

  const h = await headers();
  await recordAudit({
    category: 'auth',
    action: ok ? 'dev-console-login-success' : 'dev-console-login-fail',
    actor: h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  });

  if (!ok) {
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
