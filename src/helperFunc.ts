import { DateValue } from "@heroui/react";
import { ContentType } from "./types/Form.types";
import { getLocalTimeZone } from "@internationalized/date";

// ============================================================================
// Constants & Types
// ============================================================================

const STORAGE_PREFIX = "form_progress_";

export interface StorageKeyComponents {
  formId: string | null;
  userKey: string | null;
  suffix: string | null;
}

export interface StorageCleanupResult {
  deletedCount: number;
  deletedKeys: string[];
  keptCount?: number;
  keptKeys?: string[];
}



// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Safely access localStorage across environments (SSR, JSDOM, browser)
 */
const getStorage = (): Storage | null => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Access denied (e.g. security restriction / iframe sandbox)
  }
  return null;
};

/**
 * Safely parse JSON without throwing
 */
const safeJsonParse = <T = Record<string, unknown>>(
  value: string | null,
): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

/**
 * Deep equality comparison for objects, arrays, and primitive values
 */
function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // Handle Object comparison with numeric property precision
  if (typeof a === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    if (!aKeys.every((key) => Object.prototype.hasOwnProperty.call(bObj, key)))
      return false;

    return aKeys.every((key) => {
      const aVal = aObj[key];
      const bVal = bObj[key];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal === bVal;
      }

      return deepEqual(aVal, bVal);
    });
  }

  return false;
}

// ============================================================================
// Object & Array Change Detection
// ============================================================================

/**
 * Checks if two objects are deeply different
 */
export function hasObjectChanged<T>(oldObject: T, newValue: T): boolean {
  if (oldObject === newValue) return false;

  if (
    typeof oldObject !== "object" ||
    oldObject === null ||
    typeof newValue !== "object" ||
    newValue === null
  ) {
    return oldObject !== newValue;
  }

  const oldObj = oldObject as Record<string, unknown>;
  const newObj = newValue as Record<string, unknown>;

  const oldKeys = Object.keys(oldObj);
  const newKeys = Object.keys(newObj);

  if (oldKeys.length !== newKeys.length) return true;

  for (const key of newKeys) {
    if (
      !Object.prototype.hasOwnProperty.call(oldObj, key) ||
      hasObjectChanged(oldObj[key], newObj[key])
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if two arrays of objects have changed element-wise
 */
export const hasArrayChange = (
  arr1: Array<Record<string, unknown> | unknown>,
  arr2: Array<Record<string, unknown> | unknown>,
): boolean => {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return true;
  if (arr1.length !== arr2.length) return true;

  return !arr1.every((item, index) => deepEqual(item, arr2[index]));
};

// ============================================================================
// Date Formatting & Comparison
// ============================================================================


/**
 * Converts HeroUI DateValue to ISO string at 00:00:00 local time
 */
export const convertDateValueToString = (val: DateValue): string => {
  const date = val.toDate(getLocalTimeZone());
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};


// ============================================================================
// Calculation & Index Helpers
// ============================================================================


/**
 * Calculates updated overall form score when a page score changes
 */
export function calculateFinalTotal(
  totalScore: number,
  oldPageTotal: number,
  newPageTotal: number,
): number {
  return (totalScore || 0) - (oldPageTotal || 0) + (newPageTotal || 0);
}


// ============================================================================
// Conditional Questions & Hierarchy
// ============================================================================

/**
 * Helper to compute the highest qIdx among a question and its nested conditional chain
 */
const getLastQIdx = (
  allQuestions: Array<ContentType>,
  targetContent: ContentType,
): number => {
  const findMaxQIdxInConditionals = (
    content: ContentType,
    visited: Set<string> = new Set(),
  ): number => {
    let localMaxQIdx = content.qIdx || 0;

    const contentKey = content._id?.toString() || `qIdx_${content.qIdx}`;
    if (visited.has(contentKey)) {
      return localMaxQIdx;
    }
    visited.add(contentKey);

    if (content.conditional && content.conditional.length > 0) {
      content.conditional.forEach((condition) => {
        let childContent: ContentType | undefined;

        if (condition.contentId) {
          childContent = allQuestions.find(
            (q) =>
              q._id &&
              condition.contentId &&
              q._id.toString() === condition.contentId.toString(),
          );
        } else if (condition.contentIdx !== undefined) {
          childContent =
            (condition.contentIdx >= 0 && condition.contentIdx < allQuestions.length
              ? allQuestions[condition.contentIdx]
              : undefined) ||
            allQuestions.find(
              (q) => q.qIdx === condition.contentIdx && q !== content,
            );
        }

        if (childContent) {
          const childMaxQIdx = findMaxQIdxInConditionals(
            childContent,
            new Set(visited),
          );
          localMaxQIdx = Math.max(localMaxQIdx, childMaxQIdx);
        }
      });
    }

    visited.delete(contentKey);
    return localMaxQIdx;
  };

  let maxQIdx = Math.max(targetContent.qIdx || 0);

  if (targetContent.conditional && targetContent.conditional.length > 0) {
    const nestedMaxQIdx = findMaxQIdxInConditionals(targetContent);
    maxQIdx = Math.max(maxQIdx, nestedMaxQIdx);
  }

  return maxQIdx;
};

/**
 * Copies a question with all nested conditional sub-questions, assigning new indices
 */
export const ConditionContentCopy = ({
  org,
  allquestion,
}: {
  org: ContentType;
  allquestion: Array<ContentType>;
}): Array<ContentType> => {
  if (!org.conditional || org.conditional.length === 0) {
    return [];
  }

  const duplicatedContent: Array<ContentType> = [];
  const processedIds = new Set<string>();

  let lastQuestionIdx = getLastQIdx(allquestion, org);
  let lastMapIdx = allquestion.findIndex((i) => i.qIdx === lastQuestionIdx);
  if (lastMapIdx === -1) lastMapIdx = allquestion.length;

  const processConditionalContent = (
    parentContent: ContentType,
    parentChain: string[] = [],
  ): Array<ContentType> => {
    const results: Array<ContentType> = [];

    if (!parentContent.conditional || parentContent.conditional.length === 0) {
      return results;
    }

    lastQuestionIdx++;

    const parentCopy: ContentType = {
      ...parentContent,
      _id: undefined,
      qIdx: lastQuestionIdx,
      conditional: parentContent.conditional.map((cond, idx) => ({
        ...cond,
        _id: undefined,
        contentId: undefined,
        contentIdx: idx + 2 + (lastMapIdx || 0),
      })),
    };

    results.push(parentCopy);

    parentContent.conditional.forEach((condition, conditionIndex) => {
      let childContent: ContentType | undefined;

      if (condition.contentId) {
        childContent = allquestion.find(
          (q) =>
            q._id &&
            condition.contentId &&
            q._id.toString() === condition.contentId.toString(),
        );
      } else if (condition.contentIdx !== undefined) {
        childContent =
          (condition.contentIdx >= 0 && condition.contentIdx < allquestion.length
            ? allquestion[condition.contentIdx]
            : undefined) ||
          allquestion.find(
            (q) => q.qIdx === condition.contentIdx && q !== parentContent,
          );
      }

      if (!childContent) {
        console.warn("Child content not found for condition:", condition);
        return;
      }

      const contentKey =
        childContent._id?.toString() || `idx_${condition.contentIdx}`;
      const chainKey = [...parentChain, contentKey].join("->");

      if (processedIds.has(chainKey)) {
        console.warn("Circular dependency detected, skipping:", chainKey);
        return;
      }

      processedIds.add(chainKey);

      if (childContent.conditional && childContent.conditional.length > 0) {
        lastMapIdx++;
        const nestedResults = processConditionalContent(childContent, [
          ...parentChain,
          contentKey,
        ]);
        results.push(...nestedResults);
      } else {
        const childCopy: ContentType = {
          ...childContent,
          _id: undefined,
          qIdx: lastQuestionIdx + conditionIndex + 1,
          parentcontent: {
            qId: parentCopy._id,
            qIdx: parentCopy.qIdx,
            optIdx: childContent.parentcontent?.optIdx ?? 0,
          },
        };

        results.push(childCopy);
      }

      processedIds.delete(chainKey);
    });

    return results;
  };

  const processedContent = processConditionalContent(org);
  duplicatedContent.push(...processedContent);

  return duplicatedContent;
};




// ============================================================================
// LocalStorage & Progress Storage Management
// ============================================================================

/**
 * Generates standardized local storage keys for form progress and state
 */
export const generateStorageKey = ({
  suffix,
  formId,
  userKey,
}: {
  suffix: string;
  formId: string;
  userKey?: string;
}): string => {
  return `${STORAGE_PREFIX}${formId}${userKey ? `_${userKey}` : ""}_${suffix}`;
};

/**
 * Parses a storage key into its constituent components
 */
export const extractStorageKeyComponents = (
  storageKey: string,
): StorageKeyComponents => {
  if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) {
    return { formId: null, userKey: null, suffix: null };
  }

  const remaining = storageKey.slice(STORAGE_PREFIX.length);
  const parts = remaining.split("_");

  if (parts.length < 2) {
    return { formId: null, userKey: null, suffix: null };
  }

  const suffix = parts[parts.length - 1];
  const formId = parts[0];
  const userKey = parts.length > 2 ? parts.slice(1, -1).join("_") : null;

  return { formId, userKey, suffix };
};

/**
 * Cleans up local storage keys that do not belong to the current active form session
 */
export const cleanupUnrelatedLocalStorage = ({
  formId,
  userKey,
  suffix,
  dryRun = false,
}: {
  formId: string;
  userKey?: string;
  suffix?: string | string[];
  dryRun?: boolean;
}): StorageCleanupResult => {
  const deletedKeys: string[] = [];
  const keptKeys: string[] = [];
  const storage = getStorage();

  if (!storage) {
    return { deletedCount: 0, deletedKeys, keptCount: 0, keptKeys };
  }

  const suffixArray = suffix
    ? Array.isArray(suffix)
      ? suffix
      : [suffix]
    : null;

  try {
    const allKeys = Object.keys(storage);
    const formProgressKeys = allKeys.filter((key) =>
      key.startsWith(STORAGE_PREFIX),
    );

    formProgressKeys.forEach((key) => {
      const components = extractStorageKeyComponents(key);
      if (!components.formId) return;

      const isMatchingForm = components.formId === formId;
      const isMatchingUser = !userKey || components.userKey === userKey;
      const isSuffixMatch =
        !suffixArray ||
        (components.suffix ? suffixArray.includes(components.suffix) : false);

      let shouldKeep: boolean;
      if (isMatchingForm && isMatchingUser) {
        shouldKeep = !suffixArray || isSuffixMatch;
      } else {
        shouldKeep = suffixArray ? !isSuffixMatch : false;
      }

      if (shouldKeep) {
        keptKeys.push(key);
      } else {
        if (!dryRun) {
          storage.removeItem(key);
        }
        deletedKeys.push(key);
      }
    });

    return {
      deletedCount: deletedKeys.length,
      deletedKeys,
      keptCount: keptKeys.length,
      keptKeys,
    };
  } catch (error) {
    console.error("Failed to cleanup unrelated localStorage:", error);
    return { deletedCount: 0, deletedKeys: [], keptCount: 0, keptKeys: [] };
  }
};

/**
 * Deletes all progress keys for a specific form and optional user key
 */
export const deleteFormLocalStorage = ({
  formId,
  userKey,
}: {
  formId: string;
  userKey?: string;
}): {
  deletedCount: number;
  deletedKeys: string[];
} => {
  const deletedKeys: string[] = [];
  const storage = getStorage();

  if (!storage) {
    return { deletedCount: 0, deletedKeys };
  }

  try {
    const allKeys = Object.keys(storage);
    const formProgressKeys = allKeys.filter((key) =>
      key.startsWith(STORAGE_PREFIX),
    );

    formProgressKeys.forEach((key) => {
      const components = extractStorageKeyComponents(key);
      if (!components.formId) return;

      const isMatchingForm = components.formId === formId;
      const isMatchingUser = !userKey || components.userKey === userKey;

      if (isMatchingForm && isMatchingUser) {
        storage.removeItem(key);
        deletedKeys.push(key);
      }
    });

    return {
      deletedCount: deletedKeys.length,
      deletedKeys,
    };
  } catch (error) {
    console.error("Failed to delete form localStorage:", error);
    return { deletedCount: 0, deletedKeys: [] };
  }
};





/**
 * Saves or merges form state into local storage safely
 */
export function saveFormStateToLocalStorage<
  PartialDataType = Record<string, unknown>,
>({
  replace = false,
  key,
  data,
}: {
  replace?: boolean;
  key: string;
  data: Partial<PartialDataType>;
}): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    let payload: unknown;

    if (replace) {
      payload = data;
    } else {
      const isStored = storage.getItem(key);
      const parsedStored = safeJsonParse<Record<string, unknown>>(isStored);
      payload = { ...(parsedStored || {}), ...data };
    }

    storage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save form state to localStorage:", error);
  }
}
