# Fix: Glitchy Loading State in usePaginatedFormData Hook

## Issue Description

The `usePaginatedFormData` hook was causing "glitchy" loading behavior when:

1. **Fetching 2 times simultaneously**: Multiple queries triggered at the same time
2. **Rapid state changes**: `localformsession` updated multiple times quickly
3. **Loading flicker**: Loading state appeared/disappeared rapidly causing poor UX

## Root Causes

### 1. Unstable Query Key

```typescript
// ❌ Problem: Query key changed with every localformsession update
queryKey: [
  "respondent-form",
  formId,
  currentPage,
  fetchType,
  ...(localformsession?.isSwitchedUser ? ["switched", localformsession.isSwitchedUser] : []),
  // This spread operator caused key instability
],
```

### 2. Rapid State Updates

```typescript
// ❌ Problem: Immediate state updates without debouncing
useEffect(() => {
  if (formsession) {
    setlocalformsession(formsession); // Immediate update
  }
}, [formsession]);
```

### 3. Direct Loading State Exposure

```typescript
// ❌ Problem: Exposed isPending directly causing immediate UI changes
isLoading: isPending, // Flickered on every query change
```

## Solutions Applied

### 1. Debounced State Management

```typescript
// ✅ Added debouncing to prevent rapid updates
const stableFormsession = useMemo(() => {
  if (
    formsession &&
    JSON.stringify(formsession) !== JSON.stringify(localformsession)
  ) {
    return formsession;
  }
  return localformsession;
}, [formsession, localformsession]);

useEffect(() => {
  if (stableFormsession && stableFormsession !== localformsession) {
    // Add delay to prevent rapid updates
    const timer = setTimeout(() => {
      setlocalformsession(stableFormsession);
    }, 100);
    return () => clearTimeout(timer);
  }
}, [stableFormsession, localformsession]);
```

### 2. Stable Query Key Generation

```typescript
// ✅ Created stable query key that only changes when necessary
const stableQueryKey = useMemo(() => {
  const baseKey = ["respondent-form", formId, currentPage, fetchType];

  // Only add dynamic parts if they exist and are stable
  if (localformsession?.isSwitchedUser) {
    baseKey.push("switched", String(localformsession.isSwitchedUser));
  }
  if (user?.isAuthenticated) {
    baseKey.push("auth", String(user.isAuthenticated));
  }

  return baseKey;
}, [
  formId,
  currentPage,
  fetchType,
  localformsession?.isSwitchedUser,
  user?.isAuthenticated,
]);
```

### 3. Stable Loading State Management

```typescript
// ✅ Added stable loading state with debouncing
const [isStableLoading, setIsStableLoading] = useState(false);

useEffect(() => {
  if (isPending || isFetching) {
    setIsStableLoading(true);
  } else {
    // Add delay before hiding loading to prevent flicker
    const timer = setTimeout(() => {
      setIsStableLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }
}, [isPending, isFetching]);

// Return stable loading state
return {
  isLoading: isStableLoading, // Instead of isPending
  // ... other properties
};
```

### 4. Enhanced Query Configuration

```typescript
// ✅ Improved query settings to prevent unnecessary refetches
const { data, error, isPending, isFetching } = useQuery({
  queryKey: stableQueryKey,
  queryFn,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  enabled: enabled && !!formId && !!localformsession && accessMode !== "login",
  refetchOnWindowFocus: false,
  retry: 2,
  refetchOnMount: false,
  refetchInterval: false,
  networkMode: "online", // Prevent loading on every network change
});
```

## Benefits

### ✅ Smooth Loading Experience

- **No more glitchy loading**: Single, stable loading state
- **Debounced updates**: Prevents rapid state changes
- **Stable query caching**: Better React Query performance

### ✅ Better Performance

- **Reduced re-renders**: Stable query keys prevent unnecessary cache invalidation
- **Fewer network requests**: Debouncing prevents redundant API calls
- **Optimized caching**: Better staleTime and gcTime management

### ✅ Enhanced Debugging

- **Additional state exposure**: `isFetching` and `isPending` available for debugging
- **Console logging**: Better visibility into state changes
- **Predictable behavior**: Clear timing for state transitions

## Technical Details

### Loading State Timeline

```
Before (Glitchy):
formsession changes → immediate localformsession update → query refetch → loading flicker
formsession changes again → another immediate update → another refetch → more flicker

After (Smooth):
formsession changes → debounced evaluation → stable update after 100ms → single loading
multiple changes → consolidated into single update → single smooth loading transition
```

### Query Key Stability

```
Before: ["respondent-form", "form123", 1, "initial", "switched", true, "auth", true]
After:  ["respondent-form", "form123", 1, "initial", "switched", "true", "auth", "true"]
        ↑ More stable with string values and conditional inclusion
```

## Testing

To verify the fix:

1. **Rapid Prop Changes**: Change `formsession` quickly - should see smooth loading
2. **Network Throttling**: Use slow 3G to see stable loading behavior
3. **Console Debugging**: Check for `isFetching` and `isPending` states
4. **React DevTools**: Verify fewer re-renders in Profiler
5. **User Experience**: No more loading flicker during normal usage

## Configuration

The fix includes configurable timing:

- **Debounce delay**: 100ms for state updates (adjustable)
- **Loading stability delay**: 150ms before hiding loading (adjustable)
- **Query staleTime**: 5 minutes (can be tuned based on needs)
