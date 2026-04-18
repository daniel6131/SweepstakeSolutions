import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import DraftClient from './DraftClient';
import { DRAFT_COOKIE, isDraftProtected, isValidDraftCookie } from '@/lib/draft-auth';

export const metadata: Metadata = {
  title: 'Draft Ceremony',
  robots: { index: false, follow: false },
};

export default async function DraftPage() {
  // If DRAFT_SECRET is set, validate the session cookie
  if (isDraftProtected()) {
    const cookieStore = await cookies();
    const isAuthorized = isValidDraftCookie(cookieStore.get(DRAFT_COOKIE)?.value);
    if (!isAuthorized) {
      redirect('/draft/login');
    }
  }

  return <DraftClient />;
}
