import { useCallback, useEffect, useMemo, useRef } from "react";
import type { FocusEvent } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import type { QuestionLock } from "../redux/collab.store";
import {
  acquireQuestionLock,
  LOCK_REFRESH_MS,
  releaseQuestionLock,
} from "../services/collabService";

// Focus briefly leaves the card when a dropdown or dialog opens; don't drop
// the lock for that
const RELEASE_GRACE_MS = 1500;

// Tolerant of stores without the collab slice (isolated component tests)
const selectConnectionId = (root: RootState) => root.collab?.connectionId ?? null;
const selectLocks = (root: RootState) => root.collab?.locks;
const selectFormId = (root: RootState) => root.allform.formstate._id;

/**
 * Soft lock for one question card.
 * While this tab has focus inside the card it holds the question's lock;
 * `lockedBy` is set when a different tab (another person, or the same person
 * elsewhere) holds it, and the card should then be read-only.
 */
const useQuestionLock = (questionId?: string) => {
  const connectionId = useSelector(selectConnectionId);
  const locks = useSelector(selectLocks);
  const formId = useSelector(selectFormId);

  const refreshTimer = useRef<number | null>(null);
  const releaseTimer = useRef<number | null>(null);
  // The lock this card currently holds, with everything needed to release it
  const held = useRef<{
    formId: string;
    connectionId: string;
    questionId: string;
  } | null>(null);

  const lockedBy: QuestionLock | undefined = useMemo(() => {
    if (!questionId || !locks) return undefined;
    return locks.find(
      (lock) =>
        lock.questionId === questionId && lock.connectionId !== connectionId,
    );
  }, [locks, questionId, connectionId]);

  const stopTimers = useCallback(() => {
    if (refreshTimer.current) window.clearInterval(refreshTimer.current);
    if (releaseTimer.current) window.clearTimeout(releaseTimer.current);
    refreshTimer.current = null;
    releaseTimer.current = null;
  }, []);

  const release = useCallback(() => {
    stopTimers();
    const current = held.current;
    held.current = null;
    if (current) {
      void releaseQuestionLock(
        current.formId,
        current.connectionId,
        current.questionId,
      );
    }
  }, [stopTimers]);

  const onFocusCapture = useCallback(() => {
    // Back inside the card before the grace period ended: keep the lock
    if (releaseTimer.current) {
      window.clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    }
    if (held.current || !formId || !connectionId || !questionId) return;

    const target = { formId, connectionId, questionId };
    held.current = target;
    const refresh = () =>
      void acquireQuestionLock(
        target.formId,
        target.connectionId,
        target.questionId,
      );
    refresh();
    refreshTimer.current = window.setInterval(refresh, LOCK_REFRESH_MS);
  }, [formId, connectionId, questionId]);

  const onBlurCapture = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!held.current) return;
      const next = event.relatedTarget as Node | null;
      if (next && event.currentTarget.contains(next)) return;

      if (releaseTimer.current) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = window.setTimeout(release, RELEASE_GRACE_MS);
    },
    [release],
  );

  // A new connection id means the server already dropped the old lock
  useEffect(() => {
    if (held.current && held.current.connectionId !== connectionId) {
      stopTimers();
      held.current = null;
    }
  }, [connectionId, stopTimers]);

  // Leaving the page or removing the card frees the question for others
  useEffect(() => release, [release]);

  return { lockedBy, onFocusCapture, onBlurCapture };
};

export default useQuestionLock;
