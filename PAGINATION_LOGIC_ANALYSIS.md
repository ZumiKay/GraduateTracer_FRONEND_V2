# Pagination Logic Analysis

## Current Implementation Issues

### **Problem 1: Incorrect Visibility Logic**

```tsx
const isVisible = useMemo(
  () => (val: number) =>
    (totalPage - (val - totalPage) || totalPage - val) <= maxOffset
      ? true
      : val <= page + sibling && val > page,
  [page, totalPage]
);
```

**Issues:**

1. **Confusing expression:** `totalPage - (val - totalPage)` is equivalent to `2 * totalPage - val`, which doesn't make sense
2. **Incorrect sibling logic:** `val <= page + sibling && val > page` only shows pages to the RIGHT of current page
3. **Missing left sibling:** Should also show pages to the LEFT of current page
4. **Fallback operator issue:** The `||` with `totalPage - val` doesn't provide proper fallback logic

### **Current Behavior Example:**

```
Config: totalPage = 10, page = 5, sibling = 3, maxOffset = 5

Current logic shows:
❌ 1, 2, 3, 4, [5], 6, 7, 8, ...
   (Missing left siblings and doesn't show first/last pages properly)

Should show:
✅ 1, 2, [3, 4, 5, 6, 7, 8], 9, 10
   (1 page before, current + 2 ahead)
```

### **Problem 2: Missing Edge Cases**

The current logic doesn't handle:

- ❌ First page always visible
- ❌ Last page always visible
- ❌ Previous/Next buttons
- ❌ Jump to first/last page functionality
- ❌ Range validation

### **Problem 3: Incomplete Implementation**

```tsx
const renderPageItems = useCallback(
  (localPage: number) => {
    const dots = "...";
    return isVisible(localPage) ? (
      <PageItem key={`Pagination#${localPage}`} content={`${localPage}`} />
    ) : (
      dots // ❌ This renders dots for EACH hidden page, not a single ellipsis
    );
  },
  [isVisible]
);
```

---

## ✅ CORRECTED LOGIC

### **Better Implementation:**

```tsx
import { useCallback, useMemo } from "react";

interface PaginationProps {
  totalPage: number;
  page: number;
  setPage: (val: number) => void;
  isDisable?: boolean;
}

const PageItem = ({
  isActive,
  content,
  onPress,
  isDisabled,
}: {
  content: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
}) => {
  return (
    <button
      onClick={() => !isDisabled && onPress?.()}
      disabled={isDisabled}
      className={`
        w-[30px] h-[30px] rounded flex items-center justify-center font-bold transition-colors
        ${isActive ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      aria-label={`Page ${content}`}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </button>
  );
};

interface PaginationState {
  leftSiblings: number[];
  rightSiblings: number[];
  shouldShowLeftDots: boolean;
  shouldShowRightDots: boolean;
}

const Pagination = ({
  totalPage,
  page,
  setPage,
  isDisable = false,
}: PaginationProps) => {
  // Configuration
  const sibling = 1; // Show 1 page on each side of current page
  const maxLeft = 1; // Always show first page
  const maxRight = 1; // Always show last page

  /**
   * Calculate which pages to display
   *
   * Example: totalPage=10, page=5, sibling=1
   * Result: [1] ... [4, 5, 6] ... [10]
   */
  const paginationRange = useMemo((): PaginationState => {
    // Left siblings: pages to the left of current page
    const leftSiblingStart = Math.max(1, page - sibling);
    const leftSiblings = Array.from(
      { length: Math.min(page - 1, sibling) },
      (_, i) => page - sibling + i
    );

    // Right siblings: pages to the right of current page
    const rightSiblingEnd = Math.min(totalPage, page + sibling);
    const rightSiblings = Array.from(
      { length: Math.min(totalPage - page, sibling) },
      (_, i) => page + 1 + i
    );

    // Determine if we need left dots (gap between first page and left siblings)
    const shouldShowLeftDots = leftSiblingStart > maxLeft + 1;

    // Determine if we need right dots (gap between right siblings and last page)
    const shouldShowRightDots = rightSiblingEnd < totalPage - maxRight;

    return {
      leftSiblings,
      rightSiblings,
      shouldShowLeftDots,
      shouldShowRightDots,
    };
  }, [page, sibling, totalPage]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!isDisable && newPage >= 1 && newPage <= totalPage) {
        setPage(newPage);
      }
    },
    [setPage, isDisable, totalPage]
  );

  // Build the pagination array
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];

    // Add first page(s)
    for (let i = 1; i <= Math.min(maxLeft, totalPage); i++) {
      pages.push(i);
    }

    // Add left dots if needed
    if (paginationRange.shouldShowLeftDots) {
      pages.push("...");
    }

    // Add left siblings
    paginationRange.leftSiblings.forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });

    // Add current page
    if (!pages.includes(page)) {
      pages.push(page);
    }

    // Add right siblings
    paginationRange.rightSiblings.forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });

    // Add right dots if needed
    if (paginationRange.shouldShowRightDots) {
      pages.push("...");
    }

    // Add last page(s)
    for (let i = Math.max(totalPage - maxRight + 1, 1); i <= totalPage; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    return pages;
  }, [page, totalPage, paginationRange]);

  if (totalPage <= 1) return null;

  return (
    <div
      className="paginationComponent w-full h-fit p-2 flex items-center justify-center gap-2"
      role="navigation"
      aria-label="Pagination navigation"
    >
      {/* Previous Button */}
      <PageItem
        content="←"
        isDisabled={page === 1 || isDisable}
        onPress={() => handlePageChange(page - 1)}
      />

      {/* Page Numbers */}
      {pageNumbers.map((pageNum, idx) =>
        typeof pageNum === "string" ? (
          <span key={`dots-${idx}`} className="px-2 text-gray-400">
            {pageNum}
          </span>
        ) : (
          <PageItem
            key={`page-${pageNum}`}
            content={String(pageNum)}
            isActive={pageNum === page}
            isDisabled={isDisable}
            onPress={() => handlePageChange(pageNum)}
          />
        )
      )}

      {/* Next Button */}
      <PageItem
        content="→"
        isDisabled={page === totalPage || isDisable}
        onPress={() => handlePageChange(page + 1)}
      />
    </div>
  );
};

export default Pagination;
```

---

## Comparison: Before vs After

### **Example: 10 Pages, Current = 5, Sibling = 1**

**Before (❌ BROKEN):**

```
❌ 1 2 3 4 [5] 6 7 8 ... (incorrect)
   - Missing left siblings
   - Dots not properly rendered
   - No first/last pages shown together
```

**After (✅ CORRECT):**

```
✅ [1] ... [4] [5] [6] ... [10]
   - First page always visible
   - Left and right siblings shown
   - Dots properly placed
   - Last page always visible
   - Previous/Next buttons
```

### **Edge Cases Handled:**

| Case            | Before           | After              |
| --------------- | ---------------- | ------------------ |
| Page 1 (first)  | ❌ Incomplete    | ✅ Shows siblings  |
| Last page       | ❌ Incomplete    | ✅ Shows siblings  |
| Total < 5 pages | ❌ Poor          | ✅ All pages shown |
| Large gap       | ❌ Multiple dots | ✅ Single ellipsis |
| Disabled state  | ❌ Not handled   | ✅ Fully disabled  |

---

## Configuration Guide

```tsx
const sibling = 1; // Pages shown on each side: [X X] Current [X X]
const maxLeft = 1; // Pages always shown from left: [1] ...
const maxRight = 1; // Pages always shown from right: ... [10]
```

**Presets:**

```tsx
// Compact (few pages shown)
const sibling = 0; // Just current: [5]
const maxLeft = 1;
const maxRight = 1;

// Standard (recommended)
const sibling = 1; // [4] [5] [6]
const maxLeft = 1;
const maxRight = 1;

// Expanded
const sibling = 2; // [3] [4] [5] [6] [7]
const maxLeft = 2;
const maxRight = 2;
```

---

## Testing Scenarios

```tsx
// Test Case 1: Normal navigation
totalPage = 10, page = 5
Expected: [1] ... [4] [5] [6] ... [10]

// Test Case 2: Near beginning
totalPage = 10, page = 2
Expected: [1] [2] [3] ... [10]

// Test Case 3: Near end
totalPage = 10, page = 9
Expected: [1] ... [8] [9] [10]

// Test Case 4: Small total
totalPage = 3, page = 2
Expected: [1] [2] [3]

// Test Case 5: Single page
totalPage = 1, page = 1
Expected: (nothing shown)

// Test Case 6: Disabled state
All buttons should be disabled
```

---

## Key Improvements

✅ **Correct sibling visibility** - Shows pages both left AND right  
✅ **Proper dots handling** - Single ellipsis, not multiple  
✅ **First/Last pages** - Always visible  
✅ **Edge case handling** - All boundary conditions covered  
✅ **Accessibility** - aria-labels, aria-current  
✅ **UX improvements** - Previous/Next buttons  
✅ **Disabled state** - Proper handling  
✅ **Type safety** - Better TypeScript support  
✅ **Performance** - Proper memoization  
✅ **Readable code** - Clear variable names and logic
