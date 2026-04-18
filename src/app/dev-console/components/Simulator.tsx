import { GROUP_IDS } from '@/data/groups';
import type { GroupId } from '@/types';

const DEV_THEME = {
  bg: '#08111b',
  accent: '#7ef2cf',
  accent2: '#67b7ff',
  card: '#0f1b28',
};

type ActionGroup = {
  title: string;
  actions: Array<{ label: string; action: () => void }>;
};

type Props = {
  selectedGroup: GroupId | 'ALL';
  onGroupChange: (group: GroupId | 'ALL') => void;
  onResetFixtures: () => void;
  onClearScores: () => void;
  onRandomisePending: () => void;
  onRandomiseKnockout: () => void;
  onRandomiseAll: () => void;
  onClearSaved: () => void;
};

export function Simulator({
  selectedGroup,
  onGroupChange,
  onResetFixtures,
  onClearScores,
  onRandomisePending,
  onRandomiseKnockout,
  onRandomiseAll,
  onClearSaved,
}: Props) {
  const actionGroups: ActionGroup[] = [
    {
      title: 'Fixture state',
      actions: [
        { label: 'Reset to source', action: onResetFixtures },
        { label: 'Clear all scores', action: onClearScores },
        { label: 'Randomise pending', action: onRandomisePending },
      ],
    },
    {
      title: 'Knockout automation',
      actions: [
        { label: 'Auto-play knockout', action: onRandomiseKnockout },
        { label: 'Randomise full tournament', action: onRandomiseAll },
      ],
    },
    {
      title: 'Storage',
      actions: [{ label: 'Clear saved console state', action: onClearSaved }],
    },
  ];

  return (
    <div
      className="rounded-[28px] p-4 md:p-5"
      style={{
        background: `linear-gradient(180deg, ${DEV_THEME.card}f2 0%, ${DEV_THEME.card}dc 100%)`,
        border: `1px solid ${DEV_THEME.accent}14`,
      }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div
            className="font-heading text-[10px] font-bold uppercase tracking-[3px]"
            style={{ color: `${DEV_THEME.accent}58` }}>
            Controls
          </div>
          <div
            className="font-display mt-1 text-[28px] leading-none tracking-[-0.04em]"
            style={{ color: DEV_THEME.accent }}>
            Simulation
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {actionGroups.map((group) => (
          <div key={group.title}>
            <div
              className="font-heading mb-2 text-[9px] font-bold uppercase tracking-[2px]"
              style={{ color: `${DEV_THEME.accent}46` }}>
              {group.title}
            </div>
            <div className="grid gap-2">
              {group.actions.map(({ label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="font-heading cursor-pointer rounded-2xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[2px] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    background: `${DEV_THEME.accent}0a`,
                    border: `1px solid ${DEV_THEME.accent}14`,
                    color: '#f5f7fb',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div
          className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
          style={{ color: `${DEV_THEME.accent}58` }}>
          Filter
        </div>
        <div role="group" aria-label="Filter by group" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onGroupChange('ALL')}
            aria-pressed={selectedGroup === 'ALL'}
            className="font-heading cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[2px]"
            style={{
              background: selectedGroup === 'ALL' ? DEV_THEME.accent : `${DEV_THEME.accent}08`,
              color: selectedGroup === 'ALL' ? DEV_THEME.bg : DEV_THEME.accent,
              border: `1px solid ${DEV_THEME.accent}18`,
            }}>
            All groups
          </button>
          {GROUP_IDS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => onGroupChange(group)}
              aria-pressed={selectedGroup === group}
              className="font-heading cursor-pointer rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[2px]"
              style={{
                background: selectedGroup === group ? DEV_THEME.accent : `${DEV_THEME.accent}08`,
                color: selectedGroup === group ? DEV_THEME.bg : DEV_THEME.accent,
                border: `1px solid ${DEV_THEME.accent}18`,
              }}>
              Group {group}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
