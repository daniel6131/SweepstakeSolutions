import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import DraftClient from './DraftClient';
import { DRAFT_COOKIE, isValidDraftCookie } from '@/lib/draft-auth';

export const metadata: Metadata = {
  title: 'Draft Ceremony',
  robots: { index: false, follow: false },
};

export default async function DraftPage() {
  // always check the cookie. With no DRAFT_SECRET this is open locally but
  // closed in prod, so a missing secret locks the draft rather than leaking it.
  const cookieStore = await cookies();
  if (!isValidDraftCookie(cookieStore.get(DRAFT_COOKIE)?.value)) {
    redirect('/draft/login');
  }

  return <DraftClient />;
}
