import { redirect } from 'next/navigation';
import DraftClient from './DraftClient';

/**
 * /draft?key=YOUR_SECRET
 *
 * Password-protected draft ceremony page.
 * Set DRAFT_SECRET in .env.local (defaults to 'draft2026').
 */
export default async function DraftPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params = await searchParams;
  const secret = process.env.DRAFT_SECRET || 'draft2026';

  if (params.key !== secret) {
    redirect('/');
  }

  return <DraftClient />;
}
