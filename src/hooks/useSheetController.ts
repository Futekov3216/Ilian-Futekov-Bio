import { useCallback, useEffect, useRef, useState } from 'react';
import type { ZoneKey } from '../types';

/** Timings (ms) — keep in sync with the CSS transitions/keyframes. */
const REVEAL_ON_FOCUS = 520; // sheet starts unfolding while the camera is still zooming in
const REVEAL_AFTER_TRAVEL = 1300; // wait for the camera to land on the next zone
const FOLD_OUT = 760; // `foldOut` keyframes (.72s) + a small buffer

export interface SheetState {
  /** Zone the camera is focused on (null = plan view). */
  open: ZoneKey | null;
  /** The sheet overlay is mounted and visible. */
  reading: boolean;
  /** The sheet is playing its fold-out animation. */
  closing: boolean;
}

export interface SheetController extends SheetState {
  /** Click on a zone / mobile nav: zoom in and reveal the sheet early. */
  focus: (key: ZoneKey) => void;
  /** Fold the sheet, then return the camera to the plan. */
  close: () => void;
  /** Fold the sheet, glide the camera to `key`, then open its sheet. */
  travel: (key: ZoneKey) => void;
}

const INITIAL: SheetState = { open: null, reading: false, closing: false };

/**
 * Small state machine for the zoom-in → read → fold-out sequence.
 * A single timer is used so rapid clicks always cancel the pending step.
 */
export function useSheetController(): SheetController {
  const [state, setState] = useState<SheetState>(INITIAL);
  const stateRef = useRef(state);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };

  /** Runs `after` once the sheet has folded (immediately if none is showing). */
  const shut = useCallback((after: () => void) => {
    window.clearTimeout(timer.current);
    if (!stateRef.current.reading) {
      after();
      return;
    }
    setState((s) => ({ ...s, closing: true }));
    schedule(after, FOLD_OUT);
  }, []);

  const focus = useCallback((key: ZoneKey) => {
    const wasReading = stateRef.current.open !== null && stateRef.current.reading;
    if (wasReading) {
      setState((s) => ({ ...s, open: key }));
      return;
    }
    setState({ open: key, reading: false, closing: false });
    schedule(() => setState((s) => ({ ...s, reading: true })), REVEAL_ON_FOCUS);
  }, []);

  const close = useCallback(() => {
    if (stateRef.current.closing || stateRef.current.open === null) return;
    shut(() => setState(INITIAL));
  }, [shut]);

  const travel = useCallback(
    (key: ZoneKey) => {
      if (stateRef.current.closing) return;
      shut(() => {
        setState({ open: key, reading: false, closing: false });
        schedule(() => setState((s) => ({ ...s, reading: true })), REVEAL_AFTER_TRAVEL);
      });
    },
    [shut],
  );

  return { ...state, focus, close, travel };
}
