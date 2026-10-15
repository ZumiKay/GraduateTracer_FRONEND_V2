import { ContentType } from "../types/Form.types";

/**
 * Three-way merge of a page's questions for live collaboration.
 *
 *   base     – the page as last saved/loaded by this tab
 *   mine     – the page as it is in this tab now (base + my unsaved edits)
 *   incoming – the page as just saved by someone else
 *
 * Questions I have not touched take the incoming version; questions I have
 * unsaved edits on stay mine. Returns null when both sides added, removed or
 * reordered questions, because positions can't be reconciled safely; the
 * caller then falls back to asking the user to reload.
 */

// Editor-only or server-bookkeeping fields that don't count as an edit
const IGNORED_KEYS = new Set([
  "isVisible",
  "isChildVisibility",
  "validationIssues",
  "validationWarning",
  "questionId",
  "createdAt",
  "updatedAt",
  "__v",
]);

// Editor-only state carried over when a question is replaced by the server's copy
const LOCAL_UI_KEYS = ["isVisible", "isChildVisibility", "validationIssues"] as const;

const stableStringify = (value: unknown, topLevel = true): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item, false)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .filter((key) => !(topLevel && IGNORED_KEYS.has(key)))
      .sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key], false)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
};

const idSequence = (questions: ContentType[]) =>
  questions.map((q) => q._id ?? "").join("|");

const byId = (questions: ContentType[]) => {
  const map = new Map<string, ContentType>();
  for (const question of questions) {
    if (question._id) map.set(question._id, question);
  }
  return map;
};

const withLocalUi = (server: ContentType, local?: ContentType): ContentType => {
  if (!local) return server;
  const result = { ...server } as Record<string, unknown>;
  for (const key of LOCAL_UI_KEYS) {
    const value = (local as Record<string, unknown>)[key];
    if (value !== undefined) result[key] = value;
  }
  return result as ContentType;
};

export interface MergeResult {
  // New editor state: their saved changes plus my unsaved edits
  merged: ContentType[];
  // New "last saved" snapshot, so my kept edits still count as unsaved
  base: ContentType[];
  // How many of my edited questions were kept over the incoming copy
  keptLocalEdits: number;
}

export const mergeRemoteContent = ({
  mine,
  base,
  incoming,
}: {
  mine: ContentType[];
  base: ContentType[];
  incoming: ContentType[];
}): MergeResult | null => {
  const baseById = byId(base);
  const mineById = byId(mine);
  const incomingById = byId(incoming);

  const iChangedStructure =
    mine.some((q) => !q._id) || idSequence(mine) !== idSequence(base);
  const theyChangedStructure = idSequence(incoming) !== idSequence(base);

  if (iChangedStructure && theyChangedStructure) return null;

  const isDirty = (question: ContentType) => {
    const original = question._id ? baseById.get(question._id) : undefined;
    return !!original && stableStringify(question) !== stableStringify(original);
  };

  let keptLocalEdits = 0;
  let merged: ContentType[];

  if (!theyChangedStructure) {
    // Same questions on their side: keep my list (with any questions I added,
    // removed or moved) and pull in their edits to the ones I haven't touched
    merged = mine.map((question) => {
      const theirs = question._id ? incomingById.get(question._id) : undefined;
      if (!theirs) return question;
      if (isDirty(question)) {
        keptLocalEdits += 1;
        return question;
      }
      return withLocalUi(theirs, question);
    });
  } else {
    // They added, removed or moved questions: follow their list and put my
    // edits back on top, at the position the question now has
    merged = incoming.map((theirs) => {
      const local = theirs._id ? mineById.get(theirs._id) : undefined;
      if (local && isDirty(local)) {
        keptLocalEdits += 1;
        return {
          ...local,
          qIdx: theirs.qIdx,
          questionId: theirs.questionId,
          page: theirs.page,
        };
      }
      return withLocalUi(theirs, local);
    });
  }

  return {
    merged,
    base: incoming.map((theirs) =>
      withLocalUi(theirs, theirs._id ? mineById.get(theirs._id) : undefined),
    ),
    keptLocalEdits,
  };
};
