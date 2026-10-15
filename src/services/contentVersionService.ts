/**
 * Tracks the content version of each form page as last seen by this tab.
 *
 * Every save sends the version it is based on; the server rejects the save
 * (409) when the page has changed since, so a stale tab can never overwrite
 * or delete a collaborator's work. Kept outside React state because every
 * autosave hook instance must read the newest value synchronously.
 */

const versions = new Map<string, number>();
const conflicts = new Set<string>();

const keyOf = (formId: string, page: number) => `${formId}:${page}`;

export const getContentVersion = (formId: string, page: number) =>
  versions.get(keyOf(formId, page));

/** Records the version of a freshly loaded or saved page and clears its conflict. */
export const setContentVersion = (formId: string, page: number, version: number) => {
  versions.set(keyOf(formId, page), version);
  conflicts.delete(keyOf(formId, page));
};

/** Marks a page as out of date: saving is blocked until it is reloaded. */
export const markContentConflict = (formId: string, page: number) => {
  conflicts.add(keyOf(formId, page));
};

export const hasContentConflict = (formId: string, page: number) =>
  conflicts.has(keyOf(formId, page));

// Counts collaborator changes merged into this tab. Code that computed a new
// question list before an await can compare it afterwards to learn that its
// list is now out of date.
let remoteRevision = 0;
export const getRemoteRevision = () => remoteRevision;
export const bumpRemoteRevision = () => {
  remoteRevision += 1;
};

let saveQueue: Promise<unknown> = Promise.resolve();

/**
 * Runs saves one at a time. Two overlapping saves from this tab would
 * otherwise send the same version and the second would conflict with the first.
 */
export const runSerializedSave = <T>(task: () => Promise<T>): Promise<T> => {
  const run = saveQueue.then(task, task);
  saveQueue = run.catch(() => undefined);
  return run;
};

/** Test helper */
export const resetContentVersions = () => {
  versions.clear();
  conflicts.clear();
  remoteRevision = 0;
  saveQueue = Promise.resolve();
};
