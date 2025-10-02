# Fix: fetchContent Execution with Undefined localformsession

## Issue Description

The `fetchContent` function was being called multiple times when `localformsession` was undefined, then defined. This caused:

1. **Unnecessary function recreations** when `localformsession` changed from undefined to defined
2. **Potential query executions** with incomplete data
3. **Performance overhead** from repeated callback dependencies

## Root Cause

The original implementation had these issues:

```typescript
// ❌ Problem: fetchContent dependency on localformsession closure
const fetchContent = useCallback(async ({ ... }) => {
  if (!formId || !localformsession) return null; // Uses closure variable
  // ...
}, [localformsession]); // Recreates when localformsession changes

// ❌ Problem: Query enabled only checks formId
enabled: enabled && !!formId, // Doesn't check localformsession
```

## Solution Applied

### 1. Fixed fetchContent Dependency Issue

```typescript
// ✅ Fixed: Use parameter instead of closure
const fetchContent = useCallback(
  async ({
    formId,
    formsession, // Use the parameter
  }) => {
    if (!formId || !formsession) return null; // Check parameter
    // ...
  },
  []
); // No dependency on localformsession
```

### 2. Enhanced Query Enabled Condition

```typescript
// ✅ Fixed: Check all required conditions
enabled: enabled && !!formId && !!localformsession && accessMode !== 'login',
```

### 3. Updated Query Key for Consistency

```typescript
// ✅ Fixed: Use localformsession in query key
queryKey: [
  "respondent-form",
  formId,
  currentPage,
  fetchType,
  ...(localformsession?.isSwitchedUser ? ["switched", localformsession.isSwitchedUser] : []),
  // ...
],
```

### 4. Added Debug Logging

```typescript
// ✅ Added: Debug logs to track execution
if (!formId || !formsession) {
  console.log("fetchContent: Skipping fetch - missing requirements:", {
    formId: !!formId,
    formsession: !!formsession,
  });
  return null;
}
```

## Benefits

- **Reduced unnecessary executions**: fetchContent only runs with valid data
- **Stable function reference**: fetchContent doesn't recreate on every localformsession change
- **Better debugging**: Clear logs show when and why fetches are skipped
- **Improved performance**: Prevents wasted API calls and computations

## Testing

Monitor the console logs to verify:

1. "Skipping fetch" appears when localformsession is undefined
2. "Executing with valid session" appears only when all conditions are met
3. No repeated function recreations in React DevTools Profiler
