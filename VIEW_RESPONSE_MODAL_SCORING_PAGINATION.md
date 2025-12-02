# ViewResponseModal - Manual Scoring & Pagination Implementation

## Overview

Enhanced `ViewResponseModal` with manual scoring capabilities and response pagination, allowing administrators to score quiz responses and navigate between multiple responses without closing the modal.

## Key Features

### 1. Manual Scoring System

- **ScoreModeInput Integration**: Added score input fields for non-text questions in quiz forms with manual scoring
- **Conditional Display**: Score inputs only appear when:
  - Form is a quiz (`FormTypeEnum.Quiz`)
  - Scoring method is manual (`!isAutoScore`)
  - Question type is not text (`question.type !== QuestionType.Text`)
- **Auto-save on Blur**: Scores automatically save when user leaves the input field
- **Manual Save Button**: "Save All Scores" button appears when there are unsaved changes
- **Pending Score Tracking**: State management tracks unsaved scores before batch submission

### 2. Response Pagination

- **Navigate Between Responses**: Prev/Next buttons to move through response list
- **Position Indicator**: Shows current position (e.g., "2 / 15")
- **Index-based Navigation**: Maintains `currentResponseIndex` state
- **Auto-load Details**: Fetches full response details when navigating
- **Boundary Checks**: Disables prev/next buttons at list boundaries

### 3. User Interface Updates

- **Modal Header Enhancements**:
  - Save button with success icon (visible when changes exist)
  - Response counter chip (e.g., "2 / 15")
  - Previous/Next navigation buttons with chevron icons
  - All controls only visible when multiple responses exist

## Implementation Details

### Files Modified

#### 1. `ViewResponseModal.tsx`

**New Props:**

```typescript
interface ViewResponseModalProps {
  // ... existing props
  responseList?: ResponseListItem[]; // List of all responses for pagination
  currentResponseIndex?: number; // Current position in the list
  onNavigateResponse?: (direction: "next" | "prev") => void; // Navigation handler
  onUpdateQuestionScore?: (
    // Score update handler
    responseId: string,
    questionId: string,
    score: number
  ) => void;
}
```

**New State:**

```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [pendingScores, setPendingScores] = useState<Record<string, number>>({});
```

**Key Functions:**

- `handleQuestionScoreUpdate`: Tracks score changes and marks as unsaved
- `handleSaveAllScores`: Batch saves all pending scores and calls `onUpdateQuestionScore`
- `handleNavigate`: Validates navigation and calls parent handler
- `canGoPrev/canGoNext`: Computed navigation boundaries

**ResponseItem Component:**

- Added `onScoreUpdate` and `responseId` props
- Conditionally renders `ScoreModeInput` for scoreable questions
- Passes score updates to parent component

#### 2. `ResponseDashboard.tsx`

**New State:**

```typescript
const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
```

**New Handlers:**

```typescript
const handleNavigateResponse = useCallback(
  async (direction: "next" | "prev") => {
    if (!responseList) return;

    const newIndex =
      direction === "next"
        ? currentResponseIndex + 1
        : currentResponseIndex - 1;

    if (newIndex >= 0 && newIndex < responseList.length) {
      setCurrentResponseIndex(newIndex);
      setSelectedResponse(responseList[newIndex]);

      // Fetch full details for the new response
      const details = await fetchResponseDetails(responseList[newIndex]._id);
      setSelectedResponseDetails(details);
    }
  },
  [responseList, currentResponseIndex]
);

const handleUpdateQuestionScore = useCallback(
  (responseId: string, questionId: string, score: number) => {
    updateQuestionScoreMutation.mutate({
      responseId,
      questionId,
      score,
    });
  },
  [updateQuestionScoreMutation]
);
```

**ViewResponseModal Props:**

```typescript
<ViewResponseModal
  // ... existing props
  responseList={responseList}
  currentResponseIndex={currentResponseIndex}
  onNavigateResponse={handleNavigateResponse}
  onUpdateQuestionScore={handleUpdateQuestionScore}
/>
```

**Table Selection Update:**
When a response is selected from the table, the index is now tracked:

```typescript
onViewResponse={(response) => {
  setSelectedResponse(response);
  const index = responseList?.findIndex((r) => r._id === response._id);
  if (index !== undefined && index !== -1) {
    setCurrentResponseIndex(index);
  }
  onViewOpen();
}}
```

## User Workflow

### Manual Scoring Flow

1. Administrator opens a quiz response in View mode
2. For each non-text question with manual scoring:
   - Score input field is displayed next to the answer
   - Current score (if any) is shown
3. Administrator enters/updates score
4. Score auto-saves on blur (onBlur event)
5. Alternatively, administrator can click "Save All Scores" to batch save
6. Success toast confirms score update
7. Total score recalculates automatically

### Navigation Flow

1. Administrator views a response
2. If multiple responses exist for this form/filter:
   - Position indicator shows "X / Y"
   - Prev/Next buttons appear
3. Click Next/Prev to navigate
4. Modal content updates with new response data
5. Full response details load automatically
6. Can continue scoring while navigating

## Technical Notes

### Type Safety

- Changed `responseList` prop type from `ResponseDataType[]` to `ResponseListItem[]`
- `ResponseListItem` is the lightweight list item type (without full `responseset` data)
- Full `ResponseDataType` is only loaded when viewing specific response details
- This prevents unnecessary data transfer and improves performance

### State Management

- `currentResponseIndex`: Tracks position in response list (0-based)
- `selectedResponse`: The basic response data (ResponseListItem)
- `selectedResponseDetails`: Full response data with answers (ResponseDataType)
- `pendingScores`: Map of questionId → score for unsaved changes
- `hasUnsavedChanges`: Boolean flag to show/hide save button

### Error Handling

- Navigation validates array boundaries before updating
- Response details fetch wrapped in try-catch
- Error toast shown if details load fails
- Gracefully handles missing response list

## UI Components Used

### HeroUI Components

- `Modal`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`
- `Button` (with icons and variants)
- `Chip` (for position indicator)

### Icons (react-icons/fi)

- `FiSave`: Save button icon
- `FiChevronLeft`: Previous button icon
- `FiChevronRight`: Next button icon

### Custom Components

- `ScoreModeInput`: Score entry component with validation and auto-submit

## Performance Optimizations

- `useCallback` hooks prevent unnecessary re-renders
- `useMemo` for computed values (canGoPrev, canGoNext, totalResponses)
- Response details only loaded when navigating (not preloaded)
- Conditional rendering based on form type and scoring method

## Future Enhancements

- Keyboard shortcuts (← → arrows for navigation)
- Bulk scoring mode for multiple responses
- Score history/audit trail
- Quick navigation dropdown (jump to specific response)
- Filter responses by score range while in modal

## Testing Checklist

- ✅ Score input appears only for manual-scored, non-text questions
- ✅ Scores auto-save on blur
- ✅ Manual "Save All Scores" button works
- ✅ Navigation buttons enable/disable correctly at boundaries
- ✅ Position indicator shows correct numbers
- ✅ Response details load when navigating
- ✅ Works with filtered response lists
- ✅ No errors when response list has single item
- ✅ Score updates reflect in total score immediately
- ✅ Modal header only shows controls when applicable (quiz form, multiple responses)

## Related Files

- `ViewResponseModal.tsx` - Main modal component
- `ResponseDashboard.tsx` - Parent container with state management
- `ScoreModeInput.tsx` - Score input component
- `ResponseTable.tsx` - Response list table
- `Response.type.ts` - TypeScript interfaces
- `responseService.ts` - API service with ResponseListItem type

## Dependencies

- `@heroui/react` - UI components
- `react-icons/fi` - Feather icons
- Custom hooks: `useResponseMutations`, `useResponseFilter`, `useFetchResponseDashbardData`
