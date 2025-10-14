# Session Inactivity Warning System

## Overview

The enhanced session inactivity warning system provides a beautiful, user-friendly way to alert users when their session is about to expire due to inactivity. This system consists of three main components working together:

1. **Enhanced `useSessionManager`** - Core session management with proper `isActive` state handling
2. **`useInactivityWarning`** - Wrapper hook for easy integration
3. **`InactivityWarning`** - Beautiful modal component with countdown timer

## Architecture

```
useSessionManager (Enhanced)
    ↓ provides session state & actions
useInactivityWarning (Wrapper)
    ↓ provides simplified interface
InactivityWarning (Component)
    ↓ displays beautiful warning modal
```

## Key Features

### ✅ Enhanced Session Manager

- **Proper `isActive` State Management**: Correctly sets `formsession.isActive` to `false` when inactive and `true` when reactivated
- **Enhanced Logging**: Comprehensive console logging for debugging session state transitions
- **Improved State Synchronization**: Better coordination between localStorage and React state
- **Activity Tracking**: Monitors user interactions (mouse, keyboard, scroll, touch)
- **Automatic Timeouts**: 30-minute warning, 60-minute auto-signout

### ✅ Beautiful Warning Component

- **Modern UI**: HeroUI components with smooth animations and gradients
- **Live Countdown**: Real-time timer showing minutes and seconds until auto-logout
- **Progress Bar**: Visual indicator of remaining session time with color coding
- **Responsive Design**: Clean mobile and desktop layout
- **Blur Backdrop**: Modal with backdrop blur for focus
- **Non-dismissible**: Requires user action to continue session

### ✅ Enhanced User Experience

- **Clear Messaging**: Explains why the warning appeared and what happens next
- **Helpful Instructions**: Guides users on how to continue their session
- **Color-coded Urgency**: Green → Yellow → Red as time runs out
- **Formatted Time Display**: Clean "5:30" format for countdown
- **Professional Styling**: Consistent with application design

## Implementation

### 1. Session Manager Hook (Enhanced)

```typescript
const sessionManager = useSessionManager({
  formId: "your-form-id",
  accessMode: "authenticated",
  userEmail: "user@example.com",
  isFormRequiredSessionChecked: true,
  formsession: formsessionState,
  setformsession: setFormsessionState,
  onAutoSignOut: handleAutoSignOut,
});

// Enhanced return values include:
// - isSessionActive: boolean (properly managed)
// - showInactivityAlert: boolean
// - timeUntilAutoSignout: number | null
// - warningMessage: string | null
// - handleReactivateSession: function
// - debugInfo: detailed logging information
```

### 2. Inactivity Warning Hook (New)

```typescript
const inactivityWarning = useInactivityWarning({
  formId: "your-form-id",
  accessMode: "authenticated",
  userEmail: "user@example.com",
  isFormRequiredSessionChecked: true,
  formsession: formsessionState,
  setformsession: setFormsessionState,
  onAutoSignOut: handleAutoSignOut,
});

// Simplified interface:
// - showWarning: boolean
// - isSessionActive: boolean
// - timeUntilAutoSignout: number | null
// - warningMessage: string | null
// - handleContinueSession: function
// - debugInfo: object
```

### 3. Warning Component (New)

```typescript
<InactivityWarning
  isOpen={inactivityWarning.showWarning}
  onReactivate={inactivityWarning.handleContinueSession}
  timeUntilAutoSignout={inactivityWarning.timeUntilAutoSignout}
  warningMessage={inactivityWarning.warningMessage}
/>
```

## Session State Flow

### Normal Flow

1. **Active Session**: User interacts with form → `isActive: true`
2. **30 Minutes Inactive**: Warning appears → `showWarning: true, isActive: false`
3. **User Continues**: Clicks "Continue Session" → `isActive: true, showWarning: false`
4. **Fresh Activity**: Timer resets → Continue monitoring

### Auto-Signout Flow

1. **Active Session**: `isActive: true`
2. **30 Minutes Inactive**: Warning appears → `showWarning: true`
3. **30 More Minutes**: Auto-signout occurs → User logged out
4. **Session Ends**: All localStorage cleared → Redirect to login

## Visual Design

### Warning Modal Features

- **Header**: Warning icon + "Session Inactivity Warning" title
- **Body**:
  - Gradient card with warning message
  - Live countdown timer with chip display
  - Progress bar with color coding
  - Instructions card with tips
- **Footer**: "Continue Session" button with clock icon

### Color Coding

- **Green (>50% time)**: `success` - Plenty of time remaining
- **Yellow (25-50% time)**: `warning` - Getting close to timeout
- **Red (<25% time)**: `danger` - Critical time remaining

### Animations

- **Smooth Entry**: Modal slides in with opacity transition
- **Live Updates**: Countdown and progress bar update every second
- **Color Transitions**: Smooth color changes as time decreases

## Integration Example

### Complete PublicFormAccess Integration

```typescript
import { useInactivityWarning } from "../../hooks/useInactivityWarning";
import { InactivityWarning } from "../InactivityWarning";

function PublicFormAccess() {
  // Session management
  const sessionManager = useSessionManager({...});

  // Enhanced inactivity warning
  const inactivityWarning = useInactivityWarning({...});

  return (
    <div className="w-full min-h-screen">
      {/* Existing components */}
      <MemoizedInactivityAlert {...inactivityAlertProps} />

      {/* NEW: Enhanced Inactivity Warning Modal */}
      <InactivityWarning
        isOpen={inactivityWarning.showWarning}
        onReactivate={inactivityWarning.handleContinueSession}
        timeUntilAutoSignout={inactivityWarning.timeUntilAutoSignout}
        warningMessage={inactivityWarning.warningMessage}
      />

      {/* Rest of form */}
      {!sessionManager.showInactivityAlert && (
        <MemoizedRespondentForm {...respondentFormProps} />
      )}
    </div>
  );
}
```

## Debug Information

The enhanced system provides comprehensive debugging:

```typescript
// Session Manager Debug Info
sessionManager.debugInfo: {
  accessMode: "authenticated",
  formsessionActive: true,
  isFormRequiredSessionChecked: true,
  lastActivity: "2:30:45 PM"
}

// Console Logging Examples
"🔄 [SessionManager] User activity detected - resetting timer"
"⚠️ [SessionManager] User inactive for 30 minutes - showing warning"
"✅ [SessionManager] Session successfully reactivated"
"🚨 [InactivityWarning] Showing inactivity warning"
```

## Configuration

### Timeout Settings (useSessionManager.ts)

```typescript
const INACTIVITY_WARNING_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const AUTO_SIGNOUT_TIMEOUT = 60 * 60 * 1000; // 60 minutes
```

### Monitored Activity Events

```typescript
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
];
```

## Testing

### Test Scenarios

1. **Normal Usage**: Verify warning appears after 30 minutes of inactivity
2. **Continue Session**: Test that clicking "Continue" reactivates properly
3. **Auto-Signout**: Verify automatic logout after 60 total minutes
4. **State Persistence**: Check localStorage synchronization
5. **Multiple Tabs**: Test behavior across browser tabs
6. **Mobile Experience**: Verify touch events and responsive design

### Debug Tools

- Enable console logging to monitor state transitions
- Check `debugInfo` objects for current session state
- Verify `isActive` flag changes correctly
- Monitor localStorage for session data persistence

## Benefits

### For Users

- **Clear Warnings**: Know exactly when session will expire
- **Easy Recovery**: One-click session continuation
- **Visual Feedback**: Beautiful countdown and progress indicators
- **No Surprise Logouts**: 30-minute advance warning

### For Developers

- **Enhanced Logging**: Complete visibility into session state
- **Proper State Management**: Reliable `isActive` flag handling
- **Modular Design**: Easy to integrate and customize
- **Comprehensive Testing**: Built-in debug information

### For Business

- **Reduced Data Loss**: Users warned before auto-logout
- **Better UX**: Professional, polished inactivity handling
- **Security Compliance**: Proper session timeout management
- **Support Reduction**: Fewer "I got logged out" complaints

## Dependencies

- **React 18+**: Hooks and modern React features
- **HeroUI**: Modal, Button, Progress, Card components
- **Heroicons**: Warning and clock icons
- **TypeScript**: Full type safety and IntelliSense

## File Structure

```
src/
├── hooks/
│   ├── useSessionManager.ts (Enhanced)
│   └── useInactivityWarning.ts (New)
└── component/
    ├── InactivityWarning.tsx (New)
    └── Response/
        └── PublicFormAccess.tsx (Updated)
```

This enhanced session inactivity warning system provides a complete, production-ready solution for managing user sessions with a beautiful, user-friendly interface and comprehensive debugging capabilities.
