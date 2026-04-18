'use client';

import { Flag } from '@/components/ui/Flag';
import { getPotForRound, getPotForTeam } from '@/data/draftPots';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  C,
  flagUrl,
  formatPotLabel,
  getPlayerTeams,
  shuffleWithSeed,
  teamHue,
} from '../draft-types';
import type { Assignment, DrawPhase, DraftState } from '../draft-types';
import { ConfettiBurst } from './ConfettiBurst';
import { DraftFlag } from './DraftFlag';
import { RevealOverlay } from './RevealOverlay';

export function DraftCeremony({
  state,
  onDraw,
  roundTransition,
  onCommitDraw,
}: {
  state: DraftState;
  onDraw: () => Promise<Assignment | null>;
  roundTransition: boolean;
  onCommitDraw: () => void;
}) {
  const [drawPhase, setDrawPhase] = useState<DrawPhase>('idle');
  const [revealed, setRevealed] = useState<Assignment | null>(null);
  const [burstSeed, setBurstSeed] = useState(1);
  const [reelSeed, setReelSeed] = useState(42);
  const [tickFlash, setTickFlash] = useState(false);

  const [teaseIdx, setTeaseIdx] = useState(0);
  const teaseIdxRef = useRef(0);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const decelRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const teaseTeamsRef = useRef<string[]>([]);

  const currentPlayer = state.playerOrder[state.currentPick] || '';
  const currentPot = getPotForRound(state.currentRound);
  const currentPotLabel = formatPotLabel(currentPot);
  const currentPotTeams = useMemo(() => {
    if (!currentPot) return [];
    return state.availableTeams.filter((team) => getPotForTeam(team) === currentPot);
  }, [currentPot, state.availableTeams]);
  const teamsLeftInCurrentPot = currentPotTeams.length;
  const isLastTeamInPot = teamsLeftInCurrentPot === 1;
  const isActive = drawPhase !== 'idle' && drawPhase !== 'dealt';
  const showReveal = drawPhase === 'revealing' || drawPhase === 'dealt';

  const teaseTeams = useMemo(() => {
    return shuffleWithSeed(currentPotTeams, reelSeed).slice(
      0,
      Math.min(14, currentPotTeams.length)
    );
  }, [currentPotTeams, reelSeed]);

  const getReelTeam = useCallback(
    (absIdx: number) => {
      const list = teaseTeamsRef.current.length > 0 ? teaseTeamsRef.current : teaseTeams;
      const len = list.length;
      if (len === 0) return '';
      return list[((absIdx % len) + len) % len];
    },
    [teaseTeams]
  );

  const centerTeam = getReelTeam(teaseIdx);
  const centerHue = teamHue(centerTeam || 'x');
  const stageHue = teamHue(revealed?.team || centerTeam || 'x');
  const stageHot =
    drawPhase === 'spinning' ||
    drawPhase === 'charging' ||
    drawPhase === 'decelerating' ||
    drawPhase === 'locking';

  useEffect(() => {
    currentPotTeams.forEach((team) => {
      const img = new Image();
      img.src = flagUrl(team, 640);
    });
  }, [currentPotTeams]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
      if (decelRef.current) clearTimeout(decelRef.current);
      timers.forEach(clearTimeout);
    };
  }, []);

  const advanceTease = useCallback(() => {
    teaseIdxRef.current += 1;
    setTeaseIdx(teaseIdxRef.current);
  }, []);

  const setTease = useCallback((idx: number) => {
    teaseIdxRef.current = idx;
    setTeaseIdx(idx);
  }, []);

  function after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }

  const handleDraw = async () => {
    if (drawPhase !== 'idle' || currentPotTeams.length === 0) return;

    setReelSeed((s) => s + 1);
    const newTeaseList = shuffleWithSeed(currentPotTeams, reelSeed + 1).slice(
      0,
      Math.min(14, currentPotTeams.length)
    );
    teaseTeamsRef.current = newTeaseList;
    setTease(0);

    if (currentPotTeams.length === 1) {
      const drawn = await onDraw();
      if (!drawn) return;

      teaseTeamsRef.current = [drawn.team];
      setTease(0);
      setRevealed(drawn);
      setBurstSeed((s) => s + 1);
      setDrawPhase('locking');

      after(450, () => {
        setDrawPhase('revealing');
        after(2200, () => {
          setDrawPhase('dealt');
          onCommitDraw();
          after(600, () => {
            teaseTeamsRef.current = [];
            setDrawPhase('idle');
            setRevealed(null);
          });
        });
      });
      return;
    }

    setDrawPhase('spinning');
    cycleRef.current = setInterval(advanceTease, 55);

    after(2000, () => {
      setDrawPhase('charging');

      after(700, async () => {
        const drawn = await onDraw();
        if (!drawn) return;

        setRevealed(drawn);

        let targetSlot = teaseTeamsRef.current.indexOf(drawn.team);
        if (targetSlot < 0) {
          teaseTeamsRef.current[0] = drawn.team;
          targetSlot = 0;
        }

        setDrawPhase('decelerating');

        if (cycleRef.current) {
          clearInterval(cycleRef.current);
          cycleRef.current = null;
        }

        const len = teaseTeamsRef.current.length;
        const currentPos = teaseIdxRef.current;
        const minTicks = 14;
        let target = currentPos + ((((targetSlot - (currentPos % len)) % len) + len) % len);
        while (target - currentPos < minTicks) target += len;
        const ticksToGo = target - currentPos;

        const intervals: number[] = [];
        for (let i = 0; i < ticksToGo; i++) {
          const t = i / Math.max(ticksToGo - 1, 1);
          intervals.push(55 + t ** 2.5 * 645);
        }

        let step = 0;
        const decelTick = () => {
          const ms = intervals[step] || 700;
          advanceTease();
          step++;

          setTickFlash(true);
          after(Math.min(ms * 0.4, 80), () => setTickFlash(false));

          if (step >= ticksToGo) {
            after(300, () => {
              setDrawPhase('wobbling');
              after(220, () => {
                setTease(target);
                after(280, () => {
                  setBurstSeed((s) => s + 1);
                  setDrawPhase('locking');
                  after(800, () => {
                    setDrawPhase('revealing');
                    after(3600, () => {
                      setDrawPhase('dealt');
                      onCommitDraw();
                      after(900, () => {
                        setDrawPhase('idle');
                        setRevealed(null);
                      });
                    });
                  });
                });
              });
            });
            return;
          }

          decelRef.current = setTimeout(decelTick, ms);
        };

        decelRef.current = setTimeout(decelTick, intervals[0]);
      });
    });
  };

  const revealPoolSize =
    teaseTeamsRef.current.length > 0 ? teaseTeamsRef.current.length : teaseTeams.length;
  const showSoloReveal = isActive && revealPoolSize <= 1;

  if (roundTransition) {
    return (
      <div className="draw-exp draw-exp--center">
        <div className="draft-arena">
          <div className="draft-mesh" />
          <div className="draft-aurora" />
        </div>
        <div className="relative z-10 text-center">
          <div
            className="font-heading text-xs font-bold uppercase tracking-[6px] md:text-sm"
            style={{ color: `${C.accent}50`, animation: 'hero-fade-in 0.6s ease both' }}>
            ROUND {state.currentRound + 1} OF 4
          </div>
          <div
            className="font-display mt-3 tracking-[-0.02em]"
            style={{
              fontSize: 'clamp(40px, 10vw, 80px)',
              color: C.accent,
              animation: 'hero-fade-in 0.8s ease 0.2s both',
            }}>
            {state.currentRound < 4
              ? formatPotLabel(getPotForRound(state.currentRound))
              : 'TRADING TIME'}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'trading') {
    return (
      <div className="draw-exp draw-exp--center">
        <div className="draft-arena">
          <div className="draft-mesh" />
          <div className="draft-aurora" />
        </div>
        <div className="relative z-10 text-center">
          <div
            className="font-display tracking-[-0.02em]"
            style={{
              fontSize: 'clamp(40px, 10vw, 80px)',
              color: C.accent,
              animation: 'hero-fade-in 0.8s ease both',
            }}>
            DRAFT COMPLETE
          </div>
          <div
            className="font-heading mt-4 text-xs font-semibold uppercase tracking-[5px] md:text-sm"
            style={{ color: `${C.accent}40`, animation: 'hero-fade-in 0.8s ease 0.3s both' }}>
            TIME TO TRADE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="draw-exp"
      style={{ ['--stage-hue' as string]: stageHue }}
      onClick={drawPhase === 'idle' ? handleDraw : undefined}>
      <div
        className="draw-exp__bg"
        style={{
          background: stageHot
            ? `radial-gradient(ellipse 120% 80% at 50% 40%, hsl(${stageHue} 80% 12% / 0.7), ${C.bg} 70%)`
            : `radial-gradient(ellipse 100% 70% at 50% 30%, rgba(148, 255, 228, 0.04), ${C.bg} 60%)`,
        }}
      />
      {stageHot && (
        <div
          className="draw-exp__pulse"
          style={{
            background: `radial-gradient(circle at 50% 45%, hsl(${stageHue} 100% 50% / 0.08), transparent 50%)`,
          }}
        />
      )}

      <div className="draft-arena">
        <div className="draft-mesh" />
        <div className="draft-aurora" />
        <div className={`draft-vignette ${stageHot ? 'is-active' : ''}`} />
      </div>

      <div className="draw-topbar">
        <div className="draw-topbar__pill">Round {state.currentRound + 1}/4</div>
        <div className="draw-topbar__pill">{currentPotLabel}</div>
        <div className="draw-topbar__pill">
          Pick {state.currentPick + 1}/{state.playerOrder.length}
        </div>
        <div className="draw-topbar__pill">{teamsLeftInCurrentPot} left in pot</div>
      </div>

      <div className="draw-main">
        <div className="draw-for">
          <div className="draw-for__eyebrow">Drawing for</div>
          <div
            className="font-display draw-for__name"
            style={{ color: C.accent, textShadow: `0 0 60px ${C.accent}30` }}>
            {currentPlayer}
          </div>
        </div>

        <div className="draw-stage">
          {!isActive && (
            <div className="mystery-card" style={{ cursor: 'pointer' }}>
              <div className="mystery-card__glow" />
              <div className="mystery-card__body">
                <div className="mystery-card__shimmer" />
                <div className="mystery-card__inner-border" />
                <div className="mystery-card__content">
                  <div className="mystery-card__icon">{isLastTeamInPot ? '1' : '?'}</div>
                  <div className="mystery-card__cta">
                    {isLastTeamInPot
                      ? `FINAL TEAM IN ${currentPotLabel.toUpperCase()}`
                      : 'TAP TO DRAW'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSoloReveal && (
            <div className="flag-show flag-show--solo">
              <div
                className="flag-show__edge"
                style={{
                  background: `radial-gradient(ellipse at center, hsl(${centerHue} 100% 55% / 0.3), transparent 60%)`,
                }}
              />
              <div
                className="flag-show__card flag-show__card--solo"
                style={{
                  borderColor: `hsl(${centerHue} 70% 55% / 0.4)`,
                  boxShadow:
                    drawPhase === 'locking'
                      ? `0 0 80px hsl(${centerHue} 100% 50% / 0.38), 0 30px 60px rgba(0,0,0,0.5), inset 0 0 40px hsl(${centerHue} 100% 50% / 0.1)`
                      : `0 30px 80px rgba(0,0,0,0.5), 0 0 40px hsl(${centerHue} 80% 50% / 0.15)`,
                }}>
                <DraftFlag
                  team={centerTeam}
                  width={340}
                  height={220}
                  size={640}
                  fit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
                <div className="flag-show__shine" />
              </div>
              <div className="flag-show__name" style={{ color: `hsl(${centerHue} 80% 82%)` }}>
                {centerTeam}
              </div>
              {revealed && (
                <div className="flag-show__group" style={{ color: `${C.accent}70` }}>
                  Group {revealed.group}
                </div>
              )}
            </div>
          )}

          {isActive && !showSoloReveal && (
            <div
              className={[
                'flag-show',
                tickFlash ? 'is-tick' : '',
                drawPhase === 'locking' ? 'is-locked' : '',
                drawPhase === 'wobbling' ? 'is-wobble' : '',
              ]
                .filter(Boolean)
                .join(' ')}>
              <div
                className="flag-show__edge"
                style={{
                  background: `radial-gradient(ellipse at center, hsl(${centerHue} 100% 55% / 0.3), transparent 60%)`,
                }}
              />
              <div className="flag-show__fan">
                {([-2, -1, 0, 1, 2] as const).map((offset) => {
                  const team = getReelTeam(teaseIdx + offset);
                  const hue = teamHue(team || 'x');
                  const isCenter = offset === 0;
                  return (
                    <div
                      key={offset}
                      className="flag-show__card"
                      data-offset={String(offset)}
                      style={{
                        borderColor: `hsl(${hue} 70% 55% / ${isCenter ? 0.4 : 0.2})`,
                        boxShadow: isCenter
                          ? drawPhase === 'locking'
                            ? `0 0 80px hsl(${hue} 100% 50% / 0.4), 0 30px 60px rgba(0,0,0,0.5), inset 0 0 40px hsl(${hue} 100% 50% / 0.1)`
                            : `0 30px 80px rgba(0,0,0,0.5), 0 0 40px hsl(${hue} 80% 50% / 0.15)`
                          : `0 12px 30px rgba(0,0,0,0.4)`,
                      }}>
                      <DraftFlag
                        team={team}
                        width={320}
                        height={208}
                        size={isCenter ? 640 : 160}
                        fit="cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                      <div className="flag-show__shine" />
                    </div>
                  );
                })}
              </div>
              <div className="flag-show__name" style={{ color: `hsl(${centerHue} 80% 82%)` }}>
                {centerTeam}
              </div>
              {(drawPhase === 'locking' || showReveal) && revealed && (
                <div className="flag-show__group" style={{ color: `${C.accent}70` }}>
                  Group {revealed.group}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="draw-status">
          {drawPhase === 'idle' && (
            <div
              className="draw-status__text"
              style={{
                color: `${C.accent}40`,
                animation: 'draft-fade-pulse 2s ease-in-out infinite',
              }}>
              {isLastTeamInPot
                ? `TAP TO REVEAL THE FINAL TEAM IN ${currentPotLabel.toUpperCase()}`
                : `TAP ANYWHERE TO DRAW FROM ${currentPotLabel.toUpperCase()}`}
            </div>
          )}
          {(drawPhase === 'spinning' || drawPhase === 'charging') && (
            <div className="draft-suspense is-active" style={{ position: 'relative' }}>
              <div className="draft-suspense__label">Shuffling nations...</div>
              <div className="draft-suspense__meter">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          {drawPhase === 'decelerating' && (
            <div className="draw-status__text" style={{ color: `${C.gold}92` }}>
              Slowing down...
            </div>
          )}
          {drawPhase === 'wobbling' && (
            <div
              className="draw-status__text"
              style={{
                color: '#fff',
                animation: 'draft-fade-pulse 0.3s ease-in-out infinite',
              }}>
              ...
            </div>
          )}
          {drawPhase === 'locking' && (
            <div className="draw-status__text draw-status__text--lock" style={{ color: C.accent }}>
              {isLastTeamInPot ? 'FINAL TEAM REVEALED' : 'LOCKED IN'}
            </div>
          )}
        </div>
      </div>

      <div className="draw-roster">
        {state.playerOrder.map((name, i) => {
          const teams = getPlayerTeams(state.assignments, name);
          const isCurrent = i === state.currentPick;
          const isDone = i < state.currentPick;
          return (
            <div
              key={name}
              className={[
                'draw-roster__item',
                isCurrent ? 'is-current' : '',
                isDone ? 'is-done' : '',
              ]
                .filter(Boolean)
                .join(' ')}>
              <div className="draw-roster__name">{name}</div>
              <div className="draw-roster__flags">
                {teams.map((t) => (
                  <Flag key={t.team} team={t.team} size={14} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {drawPhase === 'locking' && <ConfettiBurst active seed={burstSeed} hue={centerHue} />}
      <RevealOverlay assignment={revealed} active={showReveal} burstSeed={burstSeed} />
    </div>
  );
}
