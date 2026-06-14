'use client';

import { ShareImageButton } from '@/components/share/ShareImageButton';
import type { ThemeColors } from '@/types';

type Props = { name: string; theme: ThemeColors };

/** Per-player share affordance: a thin wrapper over the generic ShareImageButton. */
export function ShareHandButton({ name, theme }: Props) {
  return (
    <ShareImageButton
      basePath={`/api/share/${encodeURIComponent(name)}`}
      filename={`${name}-fate-card.png`}
      title={`Share ${name}'s hand`}
      ariaLabel={`Share ${name}'s hand`}
      theme={theme}
    />
  );
}
