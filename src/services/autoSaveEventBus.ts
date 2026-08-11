/**
 Event based autosave trigger 
 */

export const AUTOSAVE_EVENT = "form:autosave-trigger" as const;

export interface AutoSaveEventDetail {
  tab: "question" | "solution";
  questionId?: string | number;
}

/**
 * Emit an autosave trigger event.
 */
export function emitAutoSaveEvent(detail: AutoSaveEventDetail): void {
  window.dispatchEvent(
    new CustomEvent<AutoSaveEventDetail>(AUTOSAVE_EVENT, {
      detail,
      bubbles: false,
    }),
  );
}

/**
 * Subscribe to autosave trigger events.
 * Returns an unsubscribe function.
 */
export function onAutoSaveEvent(
  handler: (detail: AutoSaveEventDetail) => void,
): () => void {
  const listener = (e: Event) => {
    handler((e as CustomEvent<AutoSaveEventDetail>).detail);
  };
  window.addEventListener(AUTOSAVE_EVENT, listener);
  return () => window.removeEventListener(AUTOSAVE_EVENT, listener);
}
