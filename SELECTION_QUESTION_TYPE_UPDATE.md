# Selection Question Type Update

## Overview

Updated `checkIfQuestionShouldShow` function in `useFormResponses.ts` to handle Selection question type with number-only responses.

## Changes Made

### File: `src/component/Response/hooks/useFormResponses.ts`

Added a new conditional block to handle `QuestionType.Selection` questions between the `MultipleChoice` and `CheckBox` handlers.

### Implementation Details

#### Selection Question Handling

```typescript
if (parentQuestion.type === QuestionType.Selection) {
  const responseValue = parentResponse.response;

  // Selection responses should only be numbers
  let selectedIndex: number | undefined;

  if (typeof responseValue === "number") {
    selectedIndex = responseValue;
  } else if (
    typeof responseValue === "string" &&
    !isNaN(Number(responseValue))
  ) {
    selectedIndex = Number(responseValue);
  } else {
    // Invalid response type for selection question
    return false;
  }

  // Find the selected option in the selection array
  const selectedOption = parentQuestion.selection?.find(
    (option) =>
      option.idx === selectedIndex || Number(option.idx) === selectedIndex
  );

  if (!selectedOption) {
    return false;
  }

  // Compare with expected answer
  const expectedAnswerNum = Number(expectedAnswer);
  const shouldShow =
    selectedOption.idx === expectedAnswerNum ||
    Number(selectedOption.idx) === expectedAnswerNum;

  return shouldShow;
}
```

## Key Features

### 1. Number-Only Response Validation

- Accepts `number` type responses directly
- Accepts numeric `string` responses and converts them to numbers
- Rejects any non-numeric responses (returns `false`)

### 2. Option Matching

- Searches the parent question's `selection` array for the matching option
- Compares both directly and after number conversion to handle type mismatches
- Returns `false` if no matching option is found

### 3. Conditional Display Logic

- Compares the selected option's index with the expected answer
- Handles both direct comparison and number-converted comparison
- Returns `true` only if the selected option matches the expected answer

## Behavior

### Valid Scenarios (returns `true`):

- Response is a number and matches expected answer index
- Response is a numeric string (e.g., "1") that converts to match expected answer
- Selected option's `idx` matches the `optIdx` in the child question's `parentcontent`

### Invalid Scenarios (returns `false`):

- Response is not a number or numeric string
- Response is empty, null, or undefined (handled earlier in function)
- No matching option found in the selection array
- Selected option's index doesn't match the expected answer

## Integration

This update maintains consistency with existing question type handlers:

- **MultipleChoice**: Similar logic but also accepts content strings
- **CheckBox**: Handles arrays of selections
- **Selection**: New - Number-only single selection

## Testing Recommendations

1. Test with numeric responses: `response: 1`
2. Test with numeric string responses: `response: "1"`
3. Test with invalid string responses: `response: "text"`
4. Test with matching and non-matching option indices
5. Test conditional questions that depend on selection questions
6. Test nested conditionals (selection → selection)

## Benefits

1. **Type Safety**: Enforces number-only responses for selection questions
2. **Flexibility**: Handles both number and numeric string types
3. **Consistency**: Follows the same pattern as other question type handlers
4. **Robustness**: Validates option existence before comparison
5. **Clarity**: Clear comments explaining the number-only requirement

## Date

October 19, 2025
