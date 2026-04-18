import { Flag } from '@/components/ui/Flag';
import Link from 'next/link';
import { C, getPlayerTeams } from '../draft-types';
import type { DraftState } from '../draft-types';

export function LockedScreen({ state }: { state: DraftState }) {
  const players = [...new Set(state.assignments.map((a) => a.player))];

  return (
    <div className="min-h-svh px-4 pb-10 pt-20 md:px-8 md:pt-24">
      <div className="mb-10 text-center md:mb-14">
        <div
          className="font-display tracking-[-0.02em]"
          style={{ fontSize: 'clamp(40px, 10vw, 80px)', color: C.accent }}>
          DRAFT LOCKED
        </div>
        <div
          className="font-heading mt-3 text-xs font-semibold uppercase tracking-[5px] md:text-sm"
          style={{ color: `${C.accent}35` }}>
          ASSIGNMENTS ARE FINAL
        </div>
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {players.map((player) => {
          const teams = getPlayerTeams(state.assignments, player);
          return (
            <div
              key={player}
              className="overflow-hidden rounded-xl md:rounded-2xl"
              style={{ background: C.card, border: `1.5px solid ${C.accent}10` }}>
              <div
                className="px-4 py-3"
                style={{ borderBottom: `1px solid ${C.accent}08`, background: `${C.accent}04` }}>
                <span className="font-heading text-sm font-bold" style={{ color: C.accent }}>
                  {player}
                </span>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <div
                      key={t.team}
                      className="flex items-center gap-1.5 rounded px-2 py-1"
                      style={{ background: `${C.accent}08`, border: `1px solid ${C.accent}10` }}>
                      <Flag team={t.team} size={18} />
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: `${C.accent}80` }}>
                        {t.team}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/"
          className="font-heading inline-block rounded-full px-8 py-3 text-sm font-bold uppercase tracking-[3px] transition-all duration-300 hover:scale-105"
          style={{
            background: `${C.accent}12`,
            border: `1.5px solid ${C.accent}25`,
            color: C.accent,
          }}>
          GO TO SWEEPSTAKE →
        </Link>
      </div>
    </div>
  );
}
