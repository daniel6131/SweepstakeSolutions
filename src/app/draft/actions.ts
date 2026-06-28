'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { recordAudit } from '@/lib/audit-log';
import { DRAFT_COOKIE, getDraftSecretHash, isValidDraftPassword } from '@/lib/draft-auth';

async function actorIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function authenticateDraft(formData: FormData) {
  const password = String(formData.get('password') ?? '').trim();
  const ok = isValidDraftPassword(password);

  await recordAudit({
    category: 'auth',
    action: ok ? 'draft-login-success' : 'draft-login-fail',
    actor: await actorIp(),
  });

  if (!ok) {
    redirect('/draft/login?error=1');
  }

  const hash = getDraftSecretHash();
  const cookieStore = await cookies();

  if (hash) {
    cookieStore.set(DRAFT_COOKIE, hash, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // '/' not '/draft', otherwise the cookie never reaches /api/draft where
      // the real auth check now lives.
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });
  }

  redirect('/draft');
}

export async function logoutDraft() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: DRAFT_COOKIE, path: '/' });
  redirect('/draft/login');
}
