# Page Visibility Alert Feature

## Overview

Added page visibility detection to alert users when they return to the page after being away, helping with session management and user awareness.

## Features Implemented

### 1. Page Visibility Tracking

- **Detection**: Monitors when user switches tabs, minimizes browser, or leaves the page
- **Time Tracking**: Records how long the user was away from the page
- **State Management**: Tracks page visibility state and away time

### 2. Smart Alerts

- **Return Alert**: Shows welcome back message when user returns after 5+ minutes
- **Session Status**: Displays current session status with visual indicators
- **Auto-dismiss**: Alert automatically disappears after 10 seconds

### 3. Browser Notifications

- **Permission Request**: Requests notification permission when session starts
- **Away Notification**: Shows browser notification if user is away for 15+ minutes
- **Session Warning**: Alerts about potential session expiration

## Implementation Details

### useSessionManager Hook Enhancements

#### New State Variables

```typescript
const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
const [timeAwayFromPage, setTimeAwayFromPage] = useState(0);
const [showPageVisibilityAlert, setShowPageVisibilityAlert] = useState(false);
```

#### Page Visibility Handler

```typescript
const handleVisibilityChange = useCallback(() => {
  const isVisible = !document.hidden;
  setIsPageVisible(isVisible);

  if (isVisible) {
    // User returned - calculate time away and show alert if needed
    if (awayStartTimeRef.current) {
      const timeAway = Date.now() - awayStartTimeRef.current;
      if (timeAway > 5 * 60 * 1000) {
        // 5 minutes
        setShowPageVisibilityAlert(true);
      }
    }
  } else {
    // User left - start tracking away time
    awayStartTimeRef.current = Date.now();
    // Set 15-minute notification timer
  }
}, [accessMode, formsession?.isActive]);
```

#### Browser Notification Integration

```typescript
// Request permission on session start
const requestNotificationPermission = useCallback(async () => {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}, []);

// Show notification if away too long
if ("Notification" in window && Notification.permission === "granted") {
  new Notification("Session Alert", {
    body: "You have been away from the form. Your session may expire soon.",
    icon: "/favicon.ico",
    requireInteraction: true,
  });
}
```

### PageVisibilityAlert Component

#### Features

- **Welcome Message**: Friendly "Welcome Back!" title
- **Time Display**: Shows formatted time away (e.g., "5m", "1h 30m")
- **Session Status**: Visual indicator showing session is still active
- **Dismiss Button**: Manual dismiss option
- **Auto-positioning**: Fixed position at top center of screen

#### Component Structure

```typescript
interface PageVisibilityAlertProps {
  show: boolean;
  timeAwayFromPage: number;
  onDismiss: () => void;
  isPageVisible: boolean;
}

const formatTime = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  // Returns formatted string like "5m" or "1h 30m"
};
```

### Integration with PublicFormAccess

#### New Props Object

```typescript
const pageVisibilityAlertProps = useMemo(
  () => ({
    show: sessionManager.showPageVisibilityAlert,
    timeAwayFromPage: sessionManager.timeAwayFromPage,
    onDismiss: sessionManager.dismissPageVisibilityAlert,
    isPageVisible: sessionManager.isPageVisible,
  }),
  [
    /* dependencies */
  ]
);
```

#### Rendering Order

```typescript
<div className="w-full min-h-screen">
  {/* 1. Page Visibility Alert - Top priority */}
  <PageVisibilityAlert {...pageVisibilityAlertProps} />

  {/* 2. Inactivity Alert */}
  <MemoizedInactivityAlert {...inactivityAlertProps} />

  {/* 3. Other UI elements */}
</div>
```

## User Experience Flow

### Normal Usage

1. User is actively using the form
2. Page visibility tracking runs in background
3. No alerts shown during active usage

### User Leaves Page

1. User switches tabs or minimizes browser
2. `visibilitychange` event triggered
3. Away timer starts tracking
4. 15-minute notification timer set

### User Returns

1. Page becomes visible again
2. Calculate time away
3. If away > 5 minutes: Show welcome back alert
4. Display time away and session status
5. Alert auto-dismisses after 10 seconds

### Long Absence

1. User away for 15+ minutes
2. Browser notification shown (if permission granted)
3. Warning about potential session expiration
4. When user returns: Enhanced welcome message

## Configuration

### Timing Settings

```typescript
const ALERT_THRESHOLD = 5 * 60 * 1000; // 5 minutes - show alert
const NOTIFICATION_DELAY = 15 * 60 * 1000; // 15 minutes - browser notification
const AUTO_DISMISS_DELAY = 10000; // 10 seconds - auto-dismiss alert
```

### Customizable Aspects

- **Alert threshold**: Minimum time away before showing alert
- **Notification timing**: When to show browser notification
- **Auto-dismiss timing**: How long alert stays visible
- **Alert styling**: Can be customized via Tailwind classes

## Browser Support

### Page Visibility API

- ✅ Chrome, Firefox, Safari, Edge (modern versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Graceful degradation for older browsers

### Notification API

- ✅ Chrome, Firefox, Edge
- ❌ Safari (limited support)
- 🔄 Fallback: No notifications, but page alerts still work

## Benefits

### User Experience

- **Session Awareness**: Users know their session status when returning
- **Time Context**: Clear indication of how long they were away
- **Proactive Alerts**: Warnings before session expires
- **Non-intrusive**: Alerts are helpful but not disruptive

### Session Management

- **Better Retention**: Users are reminded to stay active
- **Reduced Timeouts**: Fewer unexpected session expiration
- **Improved Engagement**: Users feel more connected to the application
- **Data Protection**: Users are aware of session security

### Technical Benefits

- **Lightweight**: Minimal performance impact
- **Memory Efficient**: Uses event listeners and timeouts efficiently
- **Cross-tab Aware**: Works across multiple tabs of same application
- **Battery Friendly**: Only active when user is on authenticated pages

## Testing

### Manual Testing

1. **Tab Switching**: Switch tabs and return after different intervals
2. **Browser Minimizing**: Minimize and restore browser window
3. **Mobile Testing**: Test on mobile devices with app switching
4. **Notification Permission**: Test with granted/denied permissions
5. **Long Absence**: Test 15+ minute away scenarios

### Automated Testing Scenarios

```typescript
// Test page visibility detection
document.dispatchEvent(new Event("visibilitychange"));

// Test timing calculations
jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

// Test notification permission
Object.defineProperty(window, "Notification", {
  value: mockNotification,
});
```

## Security Considerations

### Privacy

- **No Data Logging**: Away time not stored permanently
- **Local Only**: All tracking happens client-side
- **No External Tracking**: No third-party services involved

### Session Security

- **Session Timeout Integration**: Works with existing session management
- **No Session Extension**: Alerts don't extend session automatically
- **Security Respect**: Maintains existing security policies
