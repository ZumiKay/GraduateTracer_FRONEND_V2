# Hook Initialization Sequencing Implementation

## Overview

This document describes the implementation of proper initialization sequencing between `useFormInitialization` and `useRespondentFormPagination` hooks to prevent race conditions and ensure optimal performance.

## Problem

Previously, the `useRespondentFormPagination` hook was executing immediately when the component mounted, potentially before the form initialization was complete. This could lead to:

- Unnecessary API calls before session state was properly restored
- Race conditions between session restoration and form data fetching
- Potential authentication issues due to incomplete state initialization

## Solution

Implemented a two-phase initialization system:

### Phase 1: Form Initialization

- `useFormInitialization` hook tracks its completion state with `isInitialized` and `isInitializing` flags
- Handles session restoration from localStorage for authenticated users
- Manages guest user data initialization
- Returns completion state to coordinate with other hooks

### Phase 2: Data Fetching

- `useRespondentFormPagination` hook now accepts an `enabled` prop
- Only starts data fetching after initialization is complete (`enabled: isInitialized && !!formId`)
- Prevents premature API calls and ensures proper session state

## Implementation Details

### Modified Components

#### 1. useFormInitialization Hook

```typescript
const useFormInitialization = (
  formId: string | undefined,
  user: RootState["usersession"],
  dispatch: React.Dispatch<FormAction>
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeForm = async () => {
      setIsInitializing(true);
      setIsInitialized(false);

      try {
        // Session restoration logic...
        setIsInitialized(true);
      } catch (error) {
        console.error("Form initialization error:", error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      } finally {
        setIsInitializing(false);
      }
    };

    initializeForm();
  }, [formId, user.user?.email, user.isAuthenticated, dispatch]);

  return {
    isInitialized,
    isInitializing,
  };
};
```

#### 2. useRespondentFormPagination Hook Enhancement

- Added `enabled?: boolean` prop to `useRespondentFormPaginationProps`
- Modified `useQuery` to use `enabled: enabled && !!formId`
- Defaults to `enabled = true` for backward compatibility

#### 3. PublicFormAccess Component Updates

- Uses both `isInitialized` and `isInitializing` states
- Shows appropriate loading messages during different phases
- Conditionally enables data fetching: `enabled: isInitialized && !!formId`
- Updates AccessMode initialization to wait for form initialization

### Loading States

The component now provides better user feedback:

- **"Initializing form..."** - During session restoration and initial setup
- **"Loading form data..."** - During API data fetching

### Benefits

1. **Prevents Race Conditions**: Ensures session state is fully restored before data fetching
2. **Improved Performance**: Reduces unnecessary API calls
3. **Better UX**: Clear loading states inform users of the current process
4. **Maintainable**: Clear separation of concerns between initialization and data fetching
5. **Backward Compatible**: Existing code continues to work with the new enabled prop defaulting to true

## Usage Examples

### Conditional Hook Execution

```typescript
// Hook will only start fetching after initialization completes
const formReqData = useRespondentFormPaginaition({
  formId,
  accessMode: formState.accessMode,
  formsession: formState.formsession,
  user,
  enabled: isInitialized && !!formId,
});
```

### Loading State Management

```typescript
// Combined loading state for better UX
if (isInitializing || formReqData.isLoading) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">
          {isInitializing ? "Initializing form..." : "Loading form data..."}
        </p>
      </div>
    </div>
  );
}
```

## Testing Scenarios

To verify the implementation works correctly:

1. **Authenticated User Flow**: Session restoration should complete before data fetching begins
2. **Guest User Flow**: Guest data initialization should complete before form loading
3. **Error Handling**: Failed initialization should not block the interface indefinitely
4. **Network Conditions**: Slow session restoration should not trigger premature data fetching

## Future Enhancements

- Consider adding timeout mechanisms for initialization phases
- Implement retry logic for failed initializations
- Add telemetry to monitor initialization performance
- Create unit tests for hook sequencing behavior
