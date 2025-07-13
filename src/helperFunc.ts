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

    // Handle Object comparison
    if (typeof a === "object") {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);

      if (aKeys.length !== bKeys.length) return false;
      if (!aKeys.every((key) => bKeys.includes(key))) return false;

      return aKeys.every((key) => deepEqual(a[key as never], b[key as never]));
    }

    return false;
  }

  if (arr1.length !== arr2.length) return false;

  // Element-wise deep comparison
  return arr1.every((item, index) => deepEqual(item, arr2[index]));
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
