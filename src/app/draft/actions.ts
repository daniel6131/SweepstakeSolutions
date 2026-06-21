'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DRAFT_COOKIE, getDraftSecretHash, isValidDraftPassword } from '@/lib/draft-auth';

export async function authenticateDraft(formData: FormData) {
  const password = String(formData.get('password') ?? '').trim();

  if (!isValidDraftPassword(password)) {
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
