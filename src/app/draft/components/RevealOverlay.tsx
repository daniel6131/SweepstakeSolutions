import type { Assignment } from '../draft-types';
import { C, teamHue } from '../draft-types';
import { ConfettiBurst } from './ConfettiBurst';
import { DraftFlag } from './DraftFlag';

export function RevealOverlay({
  assignment,
  active,
  burstSeed,
}: {
  assignment: Assignment | null;
  active: boolean;
  burstSeed: number;
}) {
  if (!active || !assignment) return null;
  const hue = teamHue(assignment.team);

  return (
    <>
      <div className="reveal-flash" />
      <div className="reveal-overlay" style={{ ['--reveal-hue' as string]: hue }}>
        <div
          className="reveal-overlay__bg"
          style={{
            background: `radial-gradient(ellipse 100% 80% at 50% 35%,
              hsl(${hue} 80% 20%) 0%,
              hsl(${hue} 50% 10%) 40%,
              ${C.bg} 75%)`,
          }}
        />
        <div
          className="reveal-overlay__beam"
          style={{
            background: `conic-gradient(
              from 140deg at 50% 50%,
              transparent 0deg,
              hsl(${hue} 100% 64% / 0.12) 60deg,
              transparent 140deg,
              hsl(${(hue + 140) % 360} 100% 64% / 0.08) 240deg,
              transparent 360deg
            )`,
          }}
        />
        <div className="reveal-overlay__content">
          <div className="reveal-overlay__eyebrow">Drawn For</div>
          <div className="reveal-overlay__player">{assignment.player}</div>
          <div className="reveal-overlay__flag-wrap">
            <div
              className="reveal-overlay__flag-glow"
              style={{
                background: `radial-gradient(circle, hsl(${hue} 100% 55%) 0%, transparent 60%)`,
              }}
            />
            <DraftFlag
              team={assignment.team}
              width={300}
              height={195}
              size={640}
              fit="cover"
              className="reveal-overlay__flag"
              style={{ width: '100%', height: '100%', borderRadius: '20px' }}
            />
          </div>
          <div className="reveal-overlay__team" style={{ color: `hsl(${hue} 90% 78%)` }}>
            {assignment.team}
          </div>
          <div className="reveal-overlay__group">Group {assignment.group}</div>
        </div>
        <ConfettiBurst active hue={hue} seed={burstSeed} />
      </div>
    </>
  );
}
