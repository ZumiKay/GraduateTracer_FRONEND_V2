# ScoreComponent - Visual & Interaction Guide

## Component Layout

```
┌─────────────────────────────────────────────┐
│  Score Entry              [✓ Complete]       │  ← Header with status
├─────────────────────────────────────────────┤
│                                              │
│  Score                                       │  ← Label
│  ┌──────────────────────┬──────┐  │ 80% │   │  ← Score input with % display
│  │ pts [input: 80] /100 │      │  │     │   │
│  └──────────────────────┴──────┘  └─────┘   │
│                                              │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Progress bar
│                                              │
│  80 out of 100 points                        │  ← Status text
│                                              │
├─────────────────────────────────────────────┤
│  Feedback (Optional)                         │  ← Label
│  ┌──────────────────────────────────────────┐│
│  │ Add feedback or notes...                  ││  ← Comment input
│  └──────────────────────────────────────────┘│
│  Comment length: 145/500                     │  ← Character counter
│                                              │
├─────────────────────────────────────────────┤
│  [          Save Score           ]           │  ← Submit button
└─────────────────────────────────────────────┘
```

## State Transitions

### 1. **Initial State (No Score)**

```
Score: 0
Status: neutral (gray)
Progress: 0%
Message: "Enter a score to get started"
Button: Disabled (no changes)
```

### 2. **Good Score (≥80%)**

```
Score: 85
Status: success (green)
Progress: 85%
Message: "85 out of 100 points"
Icon: ✓ Complete checkmark
Button: Enabled (ready to save)
```

### 3. **Average Score (50-80%)**

```
Score: 60
Status: warning (amber)
Progress: 60%
Message: "60 out of 100 points"
Icon: None
Button: Enabled
```

### 4. **Low Score (<50%)**

```
Score: 30
Status: error (red)
Progress: 30%
Message: "30 out of 100 points"
Icon: None
Button: Enabled
```

### 5. **Perfect Score**

```
Score: 100
Status: success (green)
Progress: 100%
Message: "Perfect score achieved! 🎉"
Icon: ✓ Complete checkmark
Button: Enabled
```

### 6. **Invalid Score**

```
Score: 105 (exceeds max)
Status: error
Error Message: "Score cannot exceed 100"
Progress: Hidden
Button: Disabled
```

## Color Scheme

| Status  | Color            | Percentage | Use Case               |
| ------- | ---------------- | ---------- | ---------------------- |
| Success | `text-green-600` | ≥ 80%      | Excellent performance  |
| Warning | `text-amber-600` | 50-79%     | Acceptable performance |
| Error   | `text-red-600`   | < 50%      | Below acceptable       |
| Neutral | `text-gray-600`  | 0%         | No entry               |

## Interaction Flow

### Happy Path - Valid Score Entry

```
1. User focuses on score input
   ↓
2. User types "85"
   ↓ (Validation: ✓ Valid)
   ↓
3. Component updates:
   - score = 85
   - progress bar = 85%
   - status text = "85 out of 100 points"
   - color = green
   ↓
4. User optionally adds comment
   ↓
5. User clicks "Save Score"
   ↓
6. onScoreChange({ score: 85, comment: "..." })
   ↓
7. hasChanged = false
   ↓
8. Button becomes disabled again
```

### Error Path - Invalid Score

```
1. User types "105" (exceeds max of 100)
   ↓ (Validation: ✗ Invalid)
   ↓
2. Component shows error:
   - error = "Score cannot exceed 100"
   - Input border = red
   - "Save Score" button = disabled
   ↓
3. User corrects to "95"
   ↓ (Validation: ✓ Valid)
   ↓
4. Error clears
5. Button enabled
   ↓
6. User can now save
```

## Responsive Behavior

### Desktop (≥ 768px)

```
┌────────────────────────────────────┐
│ Score Entry      [✓ Complete]       │
├────────────────────────────────────┤
│ [Input: 85] /100     80%            │  ← All on one row
├────────────────────────────────────┤
│ [Comment input                    ] │
│ 0/500                               │
├────────────────────────────────────┤
│ [       Save Score        ]         │
└────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────────┐
│ Score Entry          │
│   [✓ Complete]       │
├──────────────────────┤
│ [Input: 85]  /100    │  ← Stacked
│ 80%                  │
├──────────────────────┤
│ [Comment input     ] │
│ 0/500                │
├──────────────────────┤
│ [  Save Score  ]     │
└──────────────────────┘
```

## Validation Messages

| Error       | Trigger          | Message                          |
| ----------- | ---------------- | -------------------------------- |
| Invalid     | NaN or null      | "Invalid score"                  |
| Negative    | Value < 0        | "Score cannot be negative"       |
| Exceeds Max | Value > maxScore | "Score cannot exceed {maxScore}" |

## Button States

### Enabled (Ready to Save)

```
[       Save Score       ]  ← Blue, clickable
- Has valid score
- Changes made (hasChanged = true)
- No validation errors
```

### Disabled (Cannot Save)

```
[       Save Score       ]  ← Gray, not clickable
- No changes made (hasChanged = false)
- OR validation error exists (error !== "")
```

## Progress Bar Color Mapping

```
0% ─────────────────────────────────── 100%
│         │         │         │         │
Gray     Red      Amber    Green     Green
│         │         │         │         │
0%       50%      80%     100%
(Neutral)(Error) (Warn) (Success)
```

## Character Counter

```
While typing comment:
0/500   ← Initial
15/500  ← After 15 chars
500/500 ← Maxed out (input prevents further typing)
```

## Perfect Score Celebration

When score === maxScore:

```
┌─────────────────────────────────────────┐
│  Score Entry          [✓ Complete]       │
├─────────────────────────────────────────┤
│  Score                                   │
│  ┌──────────────────────┬────────┐       │
│  │ pts [100] /100       │ 100%   │       │
│  └──────────────────────┴────────┘       │
│                                          │
│  ████████████████████████████████████░░ │
│                                          │
│  Perfect score achieved! 🎉              │  ← Celebration message
│                                          │
├─────────────────────────────────────────┤
│  Feedback (Optional)                     │
│  [                                     ] │
│  0/500                                   │
├─────────────────────────────────────────┤
│  [        Save Score         ]           │
└─────────────────────────────────────────┘
```

## Keyboard Navigation

```
Tab 1: Score Input
  ↓ (Arrow keys to adjust value or type directly)
  ↓
Tab 2: Comment Input
  ↓ (Type feedback)
  ↓
Tab 3: Save Score Button
  ↓
Press Enter/Space to submit
```

## Loading States (Future Enhancement)

```
┌─────────────────────────────────────────┐
│  Score Entry                             │
├─────────────────────────────────────────┤
│  Saving...                               │
│  ⟳ [████████████████░░░░░░░░]  50%       │
└─────────────────────────────────────────┘
```

## Success Feedback (After Save)

```
Future Enhancement - Toast/Notification
┌─────────────────────────────────────┐
│ ✓ Score saved successfully!         │
│   Score: 85/100                     │
└─────────────────────────────────────┘
```

---

**Last Updated:** November 5, 2025  
**Component Version:** 1.0.0
