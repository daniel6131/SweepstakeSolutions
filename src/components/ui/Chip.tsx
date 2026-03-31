type ChipProps = { label: string; active: boolean; accent: string; bg: string; onClick: () => void };

export function Chip({ label, active, accent, bg, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="font-heading cursor-pointer rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[2px] transition-all duration-300 md:px-4 md:py-2 md:text-[11px]"
      style={{
        border: `1.5px solid ${active ? accent : 'rgba(255,255,255,0.06)'}`,
        background: active ? accent : 'transparent',
        color: active ? bg : 'rgba(255,255,255,0.3)',
      }}
    >
      {label}
    </button>
  );
}
