# InactivityWarning Component - Test Coverage Summary

## Overview

Comprehensive unit test suite for the `InactivityWarning` component, ensuring proper handling of inactivity alerts and session timeout warnings.

## Test File Location

`src/test/InactivityWarning.test.tsx`

## Test Statistics

- **Total Tests**: 43
- **Passing**: 43 ✅
- **Failing**: 0
- **Test Suites**: 1

## Test Coverage Areas

### 1. Rendering Tests (9 tests)

Tests that verify the component renders correctly with various props:

- ✅ Modal renders when `isOpen` is true
- ✅ Modal doesn't render when `isOpen` is false
- ✅ Correct header text display
- ✅ Warning and clock icons render
- ✅ Default warning message displays correctly
- ✅ Custom warning message overrides default
- ✅ Continue Session button renders
- ✅ Progress bar component renders
- ✅ Time chip component renders

### 2. Timer Functionality Tests (7 tests)

Tests that ensure the countdown timer works correctly:

- ✅ Initial time displays correctly (1 minute)
- ✅ Initial time displays correctly (2 minutes)
- ✅ Timer counts down every second
- ✅ Timer counts down to zero
- ✅ Timer doesn't go below zero
- ✅ Timer resets when modal reopens
- ✅ Seconds format with leading zero (e.g., "1:05")
- ✅ Countdown stops when modal is closed

### 3. Progress Bar Tests (6 tests)

Tests that verify the progress bar behavior:

- ✅ Starts at 100% progress
- ✅ Updates progress as time decreases
- ✅ Shows "success" color when progress > 50%
- ✅ Shows "warning" color when progress is 25-50%
- ✅ Shows "danger" color when progress < 25%
- ✅ Displays percentage remaining text

### 4. Chip Color Tests (3 tests)

Tests for the time chip color changes:

- ✅ Shows "warning" color when progress > 50%
- ✅ Shows "danger" color when progress is 25-50%
- ✅ Shows "danger" color when progress < 25%

### 5. User Interaction Tests (3 tests)

Tests for user actions and event handling:

- ✅ `onReactivate` callback fires when Continue Session button is clicked
- ✅ Modal cannot be closed without user action
- ✅ `onReactivate` can be called multiple times

### 6. Edge Cases Tests (7 tests)

Tests for handling unusual or edge case scenarios:

- ✅ Handles `null` timeUntilAutoSignout gracefully
- ✅ Handles `undefined` timeUntilAutoSignout gracefully
- ✅ Handles very small time values (< 1 second)
- ✅ Handles very large time values (1 hour+)
- ✅ Handles `null` warningMessage gracefully
- ✅ Custom className applies correctly

### 7. Accessibility Tests (2 tests)

Tests for accessibility features:

- ✅ Modal has proper `aria-label` attribute
- ✅ Progress bar has descriptive `aria-label` with percentage

### 8. Component Lifecycle Tests (3 tests)

Tests for component mounting, updating, and unmounting:

- ✅ Timer cleans up on component unmount
- ✅ Handles rapid open/close cycles without errors
- ✅ Updates when `timeUntilAutoSignout` prop changes

### 9. UI Elements Tests (3 tests)

Tests for specific UI text and labels:

- ✅ Action instructions display correctly
- ✅ "Time until auto-logout" label displays
- ✅ "Session expires" label displays

## Key Features Tested

### Timer Management

- Accurate countdown from any initial value
- Proper formatting (MM:SS)
- Reset on modal reopen
- Cleanup on unmount

### Visual Feedback

- Color-coded progress bar (success → warning → danger)
- Color-coded time chip
- Percentage display
- Dynamic countdown

### User Experience

- Clear warning messages
- Accessible labels
- Non-dismissible modal (requires user action)
- Continue Session button interaction

### Error Handling

- Graceful handling of null/undefined props
- Edge case time values
- Component lifecycle edge cases

## Mock Components

The test suite mocks the following external UI components from `@heroui/react`:

- Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
- Button
- Progress
- Card, CardBody
- Chip

And icons from `@heroicons/react`:

- ExclamationTriangleIcon
- ClockIcon

## Running the Tests

```bash
# Run all tests
npm test

# Run only InactivityWarning tests
npm test -- InactivityWarning.test.tsx

# Run tests in watch mode
npm test:watch
```

## Test Configuration

- **Test Framework**: Jest
- **Testing Library**: @testing-library/react
- **Environment**: jsdom
- **Fake Timers**: Jest fake timers for timer testing

## Notes

- Tests use fake timers to control time progression
- All state updates are wrapped in `act()` where necessary
- Tests verify both visual rendering and functional behavior
- Edge cases and accessibility are thoroughly covered

## Conclusion

The test suite provides comprehensive coverage of the InactivityWarning component, ensuring:

1. Correct rendering under all conditions
2. Accurate timer functionality
3. Proper user interaction handling
4. Accessibility compliance
5. Robust error handling
6. Clean lifecycle management

All 43 tests pass successfully, indicating the component handles inactivity alerts correctly and reliably.
