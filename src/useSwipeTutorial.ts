import { useCallback, useEffect, useRef, useState } from 'react';

import {
  needsTutorial,
  parseRecord,
  storageKey,
  type TutorialRecord,
  type TutorialStorage,
} from './storage';

export type TutorialStatus = 'loading' | 'pending' | 'completed';

export interface UseSwipeTutorialOptions {
  /** Stable id for this tutorial, e.g. "photo-deck". Namespaces the storage key. */
  id: string;
  /** Where completion is remembered. Pass AsyncStorage in production. */
  storage: TutorialStorage;
  /**
   * Bump this when the gestures change meaningfully. Users who completed an
   * older version see the tutorial again; nobody else is affected.
   */
  version?: number;
  /** Set to false to keep the tutorial hidden, e.g. until the deck has cards. */
  enabled?: boolean;
  /** Called when reading or writing storage fails. The tutorial degrades, it never throws. */
  onError?: (error: unknown) => void;
}

export interface UseSwipeTutorialResult {
  status: TutorialStatus;
  /** True when the overlay should be on screen. */
  visible: boolean;
  /** Hide the tutorial and remember it for this version. */
  complete: () => Promise<void>;
  /** Show the tutorial again this session without forgetting completion, e.g. from a help menu. */
  show: () => void;
  /** Forget completion and show the tutorial again. */
  reset: () => Promise<void>;
}

interface Snapshot {
  /** Which id/version this status belongs to. */
  key: string;
  status: Exclude<TutorialStatus, 'loading'>;
  /** Set when the user acted, so a slower storage read cannot override them. */
  fromUser: boolean;
}

export function useSwipeTutorial({
  id,
  storage,
  version = 1,
  enabled = true,
  onError,
}: UseSwipeTutorialOptions): UseSwipeTutorialResult {
  const key = `${id}@${version}`;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  // Anything recorded for a different id/version is stale: we are loading.
  const status: TutorialStatus = snapshot?.key === key ? snapshot.status : 'loading';

  // Callers rarely memoize these, so keep them in refs to avoid re-reading
  // storage on every render.
  const storageRef = useRef(storage);
  const onErrorRef = useRef(onError);
  // Declared before the read effect below, so it always sees the latest values.
  useEffect(() => {
    storageRef.current = storage;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;

    storageRef.current
      .getItem(storageKey(id))
      .then(
        (raw): Snapshot['status'] =>
          needsTutorial(parseRecord(raw), version) ? 'pending' : 'completed',
        (error: unknown): Snapshot['status'] => {
          onErrorRef.current?.(error);
          // Better to teach the gesture once too often than never.
          return 'pending';
        },
      )
      .then((next) => {
        if (cancelled) return;
        setSnapshot((prev) =>
          prev?.key === key && prev.fromUser ? prev : { key, status: next, fromUser: false },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id, version, key]);

  const complete = useCallback(async () => {
    setSnapshot({ key, status: 'completed', fromUser: true });
    const record: TutorialRecord = {
      version,
      completedAt: new Date().toISOString(),
    };
    try {
      await storageRef.current.setItem(storageKey(id), JSON.stringify(record));
    } catch (error) {
      // Stay hidden for this session; it will show again next launch.
      onErrorRef.current?.(error);
    }
  }, [id, version, key]);

  const show = useCallback(() => {
    setSnapshot({ key, status: 'pending', fromUser: true });
  }, [key]);

  const reset = useCallback(async () => {
    setSnapshot({ key, status: 'pending', fromUser: true });
    try {
      await storageRef.current.removeItem(storageKey(id));
    } catch (error) {
      onErrorRef.current?.(error);
    }
  }, [id, key]);

  return {
    status,
    visible: enabled && status === 'pending',
    complete,
    show,
    reset,
  };
}
