import { DateValue } from "@heroui/react";
import { ContentType } from "./types/Form.types";
import { getLocalTimeZone } from "@internationalized/date";
import { GuestData } from "./types/PublicFormAccess.types";

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

  const oldKeys = Object.keys(oldObject);
  const newKeys = Object.keys(newValue);

  if (oldKeys.length !== newKeys.length) return true;

  for (const key of newKeys) {
    if (
      !oldKeys.includes(key) ||
      hasObjectChanged(oldObject[key as never], newValue[key as never])
    ) {
      return true;
    }
  }

  return false;
}

export const hasArrayChange = (arr1: Array<object>, arr2: Array<object>) => {
  function deepEqual<t>(a: t, b: t): boolean {
    if (a === b) return true;

    if (a == null || b == null) return false;

    if (typeof a !== typeof b) return false;

    if (a instanceof Date && b instanceof Date)
      return a.getTime() === b.getTime();

    // Handle Array comparison
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    }

    // Handle Object comparison with special handling for numeric properties like score
    if (typeof a === "object") {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);

      if (aKeys.length !== bKeys.length) return false;
      if (!aKeys.every((key) => bKeys.includes(key))) return false;

      return aKeys.every((key) => {
        const aVal = a[key as never];
        const bVal = b[key as never];

        // Special handling for numeric values (like score) to handle type coercion
        if (typeof aVal === "number" && typeof bVal === "number") {
          return aVal === bVal;
        }

        return deepEqual(aVal, bVal);
      });
    }

    return false;
  }

  if (arr1.length !== arr2.length) return true; // Return true if arrays have different lengths (change detected)

  // Element-wise deep comparison - return true if ANY element is different (change detected)
  return !arr1.every((item, index) => deepEqual(item, arr2[index]));
};

export const FormatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
export const CalculateNewIdx = (
  delIndexes: number,
  currentIdx: number
): number => Math.abs(currentIdx - delIndexes);

//Copy content with condition with nested child question

//Get Last QIdx
const getLastQIdx = (
  allQuestions: Array<ContentType>,
  targetContent: ContentType
): number => {
  const findMaxQIdxInConditionals = (
    content: ContentType,
    visited: Set<string> = new Set()
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
              q._id.toString() === condition.contentId.toString()
          );
        } else if (condition.contentIdx !== undefined) {
          childContent = allQuestions[condition.contentIdx];
        }

        if (childContent) {
          // Get the max qIdx from this child and its nested conditionals
          const childMaxQIdx = findMaxQIdxInConditionals(
            childContent,
            new Set(visited)
          );
          localMaxQIdx = Math.max(localMaxQIdx, childMaxQIdx);
        }
      });
    }

    visited.delete(contentKey);
    return localMaxQIdx;
  };

  let maxQIdx = Math.max(targetContent.qIdx || 0);

  // Find the maximum qIdx starting from the target content's conditionals
  if (targetContent.conditional && targetContent.conditional.length > 0) {
    const nestedMaxQIdx = findMaxQIdxInConditionals(targetContent);
    maxQIdx = Math.max(maxQIdx, nestedMaxQIdx);
  }

  return maxQIdx;
};

export const ConditionContentCopy = ({
  org,
  allquestion,
}: {
  org: ContentType;
  allquestion: Array<ContentType>;
}): Array<ContentType> | [] => {
  if (!org.conditional || org.conditional.length === 0) {
    return [];
  }

  const duplicatedContent: Array<ContentType> = [];
  const processedIds = new Set<string>();

  let lastQuestionIdx = getLastQIdx(allquestion, org);

  let lastMapIdx = allquestion.findIndex((i) => i.qIdx === lastQuestionIdx);

  const processConditionalContent = (
    parentContent: ContentType,
    parentChain: string[] = []
  ): Array<ContentType> => {
    const results: Array<ContentType> = [];

    if (!parentContent.conditional || parentContent.conditional.length === 0) {
      return results;
    }

    lastQuestionIdx++;
    // Create a copy of the parent with updated conditional references

    const parentCopy: ContentType = {
      ...parentContent,
      _id: undefined,
      qIdx: lastQuestionIdx,
      conditional: parentContent.conditional.map((cond, idx) => ({
        ...cond,
        _id: undefined,
        contentId: undefined,
        contentIdx: idx + 2 + (lastMapIdx || 0), //Assign new Idx
      })),
    };

    results.push(parentCopy);

    // Process each conditional child
    parentContent.conditional.forEach((condition, conditionIndex) => {
      let childContent: ContentType | undefined;

      if (condition.contentId) {
        childContent = allquestion.find(
          (q) =>
            q._id &&
            condition.contentId &&
            q._id.toString() === condition.contentId.toString()
        );
      } else if (condition.contentIdx !== undefined) {
        childContent = allquestion[condition.contentIdx];
      }

      if (!childContent) {
        console.warn(`Child content not found for condition:`, condition);
        return;
      }

      const contentKey =
        childContent._id?.toString() || `idx_${condition.contentIdx}`;
      const chainKey = [...parentChain, contentKey].join("->");

      if (processedIds.has(chainKey)) {
        console.warn(`Circular dependency detected, skipping:`, chainKey);
        return;
      }

      processedIds.add(chainKey);

      // Create child copy with parent reference
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
            qIdx: org.conditional?.length ?? 0 + 1,
            optIdx: childContent.parentcontent?.optIdx ?? 0,
          },
        };

        results.push(childCopy);
      }

      // Process nested conditions (Recursively)

      //Remove processed question
      processedIds.delete(chainKey);
    });

    return results;
  };

  // Process conditions
  const processedContent = processConditionalContent(org);

  duplicatedContent.push(...processedContent);

  return duplicatedContent;
};

/**
 * Utility function to validate conditional content structure
 */
export const validateConditionalStructure = (
  content: Array<ContentType>
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const contentMap = new Map<string, ContentType>();

  // Build content map
  content.forEach((item) => {
    if (item._id) {
      contentMap.set(item._id.toString(), item);
    }
  });

  // Validate each item's conditional references
  content.forEach((item, index) => {
    if (item.conditional) {
      item.conditional.forEach((cond, condIndex) => {
        // Check if referenced content exists
        if (cond.contentId && !contentMap.has(cond.contentId.toString())) {
          errors.push(
            `Item ${index}: Conditional ${condIndex} references non-existent content ID ${cond.contentId}`
          );
        }

        if (cond.contentIdx !== undefined && !content[cond.contentIdx]) {
          errors.push(
            `Item ${index}: Conditional ${condIndex} references invalid content index ${cond.contentIdx}`
          );
        }
      });
    }

    // Validate parent content references
    if (item.parentcontent) {
      if (item.parentcontent.qId && !contentMap.has(item.parentcontent.qId)) {
        errors.push(
          `Item ${index}: Parent content references non-existent ID ${item.parentcontent.qId}`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Utility function to flatten nested conditional content structure
 */
export const flattenConditionalContent = (
  content: Array<ContentType>
): Array<ContentType> => {
  const flattened: Array<ContentType> = [];
  const processed = new Set<string>();

  const processItem = (item: ContentType, depth: number = 0) => {
    if (depth > 10) return; // Prevent infinite recursion

    const itemKey = item._id?.toString() || `temp_${flattened.length}`;
    if (processed.has(itemKey)) return;

    processed.add(itemKey);
    flattened.push(item);

    // Process conditional children
    if (item.conditional) {
      item.conditional.forEach((cond) => {
        const childContent = content.find(
          (c) =>
            (cond.contentId &&
              c._id?.toString() === cond.contentId.toString()) ||
            (cond.contentIdx !== undefined && content[cond.contentIdx] === c)
        );

        if (childContent) {
          processItem(childContent, depth + 1);
        }
      });
    }
  };

  // Process all top-level items (items without parent content)
  content
    .filter((item) => !item.parentcontent)
    .forEach((item) => processItem(item));

  return flattened;
};

export const getConditionalDepth = (
  content: ContentType,
  allContent: Array<ContentType>
): number => {
  const calculateDepth = (
    item: ContentType,
    currentDepth: number = 0
  ): number => {
    if (!item.conditional || currentDepth > 10) return currentDepth;

    let deepestChild = currentDepth;

    item.conditional.forEach((cond) => {
      const childContent = allContent.find(
        (c) =>
          (cond.contentId && c._id?.toString() === cond.contentId.toString()) ||
          (cond.contentIdx !== undefined && allContent[cond.contentIdx] === c)
      );

      if (childContent) {
        const childDepth = calculateDepth(childContent, currentDepth + 1);
        deepestChild = Math.max(deepestChild, childDepth);
      }
    });

    return deepestChild;
  };

  return calculateDepth(content);
};

export const convertDateValueToString = (val: DateValue) => {
  return val.toDate(getLocalTimeZone()).toISOString();
};

export const isMoreThanDay = (val: Date): boolean => {
  const now = new Date();
  const diffMs = now.getTime() - val.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return diffMs > oneDayMs;
};

export const generateStorageKey = ({
  suffix,
  formId,
  userKey,
}: {
  suffix: string;
  formId: string;
  userKey?: string;
}) => {
  return `form_progress_${formId}${userKey ? `_${userKey}` : ""}_${suffix}`;
};

export const extractStorageKeyComponents = (
  storageKey: string
): {
  formId: string | null;
  userKey: string | null;
  suffix: string | null;
} => {
  const prefix = "form_progress_";

  if (!storageKey.startsWith(prefix)) {
    return { formId: null, userKey: null, suffix: null };
  }

  const remaining = storageKey.slice(prefix.length);

  const parts = remaining.split("_");

  if (parts.length < 2) {
    return { formId: null, userKey: null, suffix: null };
  }

  const suffix = parts[parts.length - 1];

  const formId = parts[0];

  const userKey = parts.length > 2 ? parts.slice(1, -1).join("_") : null;

  return { formId, userKey, suffix };
};

/* --------------------- Respondent Form Session Helper --------------------- */

export const saveGuestData = (
  guestData: GuestData,
  customKey?: string
): void => {
  try {
    // Use sessionStorage instead of localStorage for guest data
    sessionStorage.setItem(
      customKey ?? "guest_session",
      JSON.stringify({
        ...guestData,
        timestamp: Date.now(),
        sessionId: crypto.randomUUID(), // Add unique session ID
      })
    );
  } catch (error) {
    console.error("Failed to save guest data:", error);
  }
};

export const getGuestData = (): GuestData | null => {
  try {
    const data = sessionStorage.getItem("guest_session");
    if (!data) return null;

    const parsed = JSON.parse(data);

    // If session exceed 1 days removed
    const ADays = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > ADays) {
      removeGuestData();
      return null;
    }

    return {
      name: parsed.name,
      email: parsed.email,
      rememberMe: parsed.rememberMe || false,
      isActive: parsed.isActive || false,
    };
  } catch (error) {
    console.error("Failed to get guest data:", error);
    return null;
  }
};

export const removeGuestData = (): void => {
  try {
    sessionStorage.removeItem("guest_session");
  } catch (error) {
    console.error("Failed to remove guest data:", error);
  }
};
