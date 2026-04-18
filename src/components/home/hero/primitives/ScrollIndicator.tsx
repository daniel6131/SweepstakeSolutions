import type { ThemeColors } from '@/types';

export function ScrollIndicator({ theme }: { theme: ThemeColors }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="font-heading text-[8px] font-semibold uppercase tracking-[4px] md:text-[9px]"
        style={{ color: `${theme.accent}30` }}>
        SCROLL
      </div>
      <div className="scroll-chevron" style={{ color: `${theme.accent}40` }}>
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
          <path
            d="M1 1L7 7L13 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
