'use client';

import { Dialog } from '@/components/ui/Dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DraftCeremony } from './components/DraftCeremony';
import { IntroScreen } from './components/IntroScreen';
import { LockedScreen } from './components/LockedScreen';
import { TradingFloor } from './components/TradingFloor';
import { C, draftApi } from './draft-types';
import type { Assignment, DraftState } from './draft-types';

type DialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'default' | 'danger';
  onConfirm: () => void;
};

const CLOSED_DIALOG: DialogState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  variant: 'default',
  onConfirm: () => {},
};

export default function DraftClient() {
  const [state, setState] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundTransition, setRoundTransition] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(CLOSED_DIALOG);

  const roundTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<DraftState | null>(null);
  const pendingRoundTransitionRef = useRef(false);

  useEffect(() => {
    draftApi().then((s) => {
      setState(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (roundTransitionTimer.current) clearTimeout(roundTransitionTimer.current);
    };
  }, []);

  const triggerRoundTransition = useCallback(() => {
    setRoundTransition(true);
    if (roundTransitionTimer.current) clearTimeout(roundTransitionTimer.current);
    roundTransitionTimer.current = setTimeout(() => setRoundTransition(false), 2500);
  }, []);

  const handleStart = useCallback(async () => {
    const s = await draftApi('start');
    setState(s);
  }, []);

  const handleDraw = useCallback(async (): Promise<Assignment | null> => {
    const prevRound = state?.currentRound ?? 0;
    const prevStatus = state?.status;
    const s = await draftApi('draw');
    pendingStateRef.current = s;
    if (prevStatus === 'drafting' && s.status === 'drafting' && s.currentRound > prevRound) {
      pendingRoundTransitionRef.current = true;
    }
    return (s as DraftState & { lastDrawn?: Assignment }).lastDrawn || null;
  }, [state]);

  const commitPendingDraw = useCallback(() => {
    if (pendingStateRef.current) {
      setState(pendingStateRef.current);
      pendingStateRef.current = null;
    }
    if (pendingRoundTransitionRef.current) {
      pendingRoundTransitionRef.current = false;
      triggerRoundTransition();
    }
  }, [triggerRoundTransition]);

  const handleTrade = useCallback(async (p1: string, t1: string, p2: string, t2: string) => {
    const s = await draftApi('trade', { player1: p1, team1: t1, player2: p2, team2: t2 });
    setState(s);
  }, []);

  const handleLock = useCallback(() => {
    setDialog({
      open: true,
      title: 'Lock assignments?',
      description: 'This will finalise all team draws. This cannot be undone.',
      confirmLabel: 'Lock it in',
      variant: 'danger',
      onConfirm: async () => {
        const s = await draftApi('lock');
        setState(s);
      },
    });
  }, []);

  const closeDialog = useCallback(() => setDialog((d) => ({ ...d, open: false })), []);

  if (loading || !state) {
    return (
      <div className="flex min-h-svh items-center justify-center" style={{ background: C.bg }}>
        <div className="draft-orb draft-orb--pulse" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-svh"
      style={{ background: C.bg, color: '#fbfbfb', fontFamily: "'DM Sans', sans-serif" }}>
      {state.status !== 'locked' && (
        <button
          onClick={() =>
            setDialog({
              open: true,
              title: 'Reset draft?',
              description: 'All assignments and progress will be permanently erased.',
              confirmLabel: 'Reset',
              variant: 'danger',
              onConfirm: async () => {
                const s = await draftApi('reset');
                setState(s);
              },
            })
          }
          className="font-heading fixed right-4 top-4 z-50 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase tracking-[2px] opacity-20 transition-opacity hover:opacity-80"
          style={{
            background: `${C.accent}10`,
            color: C.accent,
            border: `1px solid ${C.accent}15`,
          }}>
          RESET
        </button>
      )}

      {state.status === 'pending' && <IntroScreen onStart={handleStart} />}
      {state.status === 'drafting' && (
        <DraftCeremony
          state={state}
          onDraw={handleDraw}
          roundTransition={roundTransition}
          onCommitDraw={commitPendingDraw}
        />
      )}
      {state.status === 'trading' && (
        <TradingFloor state={state} onTrade={handleTrade} onLock={handleLock} />
      )}
      {state.status === 'locked' && <LockedScreen state={state} />}

      <Dialog
        open={dialog.open}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        description={dialog.description}
        confirmLabel={dialog.confirmLabel}
        variant={dialog.variant}
      />
    </div>
  );
}
