# ScoreComponent - Auto-Submit on Blur (Quick Reference)

## 🎯 What Changed?

The component now **automatically submits** when the user blurs (clicks away) from either the score or comment input, but **only if**:

| Condition  | Requirement                           |
| ---------- | ------------------------------------- |
| Score      | Must be > 0                           |
| Comment    | Must have text (not empty/whitespace) |
| Validation | No errors, score is valid             |
| Changes    | User must have made changes           |

## 📊 When Auto-Submit Happens

✅ **YES - Submit on blur when:**

```
Score: 85           ✓
Comment: "Good!"    ✓
Error: (none)       ✓
Changes: true       ✓
→ AUTO-SUBMIT ✓
```

❌ **NO - Don't submit when:**

```
Score: 0            ✗ (empty)
Comment: "Good!"    ✓
→ SKIP

Score: 85           ✓
Comment: ""         ✗ (empty)
→ SKIP

Score: 105          ✗ (exceeds max)
Comment: "Good!"    ✓
Error: "Exceeds max"✗
→ SKIP

Score: 85           ✓
Comment: "Good!"    ✓
Changes: false      ✗ (no changes)
→ SKIP
```

## 🔄 User Flow

```
┌─ Score Input
│  User types: 85
│  Blur (click away)
│         ↓
│  Check: Both inputs filled? No → Skip
└─ Comment Input
   User types: "Good!"
   Blur (click away)
          ↓
   Check: Both inputs filled? Yes ✓
   Check: Valid? Yes ✓
   Check: Changes made? Yes ✓
          ↓
      SUBMIT ✓
```

## 💻 Code Logic

```typescript
// Called on blur from either input
const handleInputBlur = useCallback(() => {
  const hasBothInputs = localScore > 0 && comment.trim().length > 0;
  const isValid = !error && validateScore(localScore);

  if (hasBothInputs && isValid && hasChanged) {
    handleSubmit(); // Auto-submit
  }
}, [localScore, comment, error, validateScore, hasChanged, handleSubmit]);
```

## ✨ Benefits

- ✅ Auto-saves complete, valid entries
- ✅ No button click needed
- ✅ Won't save incomplete data
- ✅ Respects validation rules
- ✅ Button still works if needed

## 🧪 Test Cases

**Test 1:** Score ✓ + Comment ✓ → Auto-submit ✓

**Test 2:** Score ✓ + Comment ✗ → Skip ✓

**Test 3:** Score ✗ (error) + Comment ✓ → Skip ✓

**Test 4:** Score ✓ + Comment (spaces) → Skip ✓

**Test 5:** No changes made → Skip ✓

## 📝 Example

```tsx
<ScoreModeInput
  maxScore={100}
  onScoreChange={(data) => {
    console.log("Saved:", data);
    // Called automatically on blur when:
    // - Score > 0
    // - Comment has text
    // - No validation errors
    // - Changes were made
  }}
/>
```

**User steps:**

1. Type score: `85`
2. Type comment: `"Great work"`
3. Click outside input
4. ✓ Auto-saves: `{ score: 85, comment: "Great work" }`

## 🚀 Quick Facts

| Aspect              | Value                     |
| ------------------- | ------------------------- |
| Auto-Submit Trigger | On blur from either input |
| Requires Score      | Yes (> 0)                 |
| Requires Comment    | Yes (non-empty)           |
| Validates           | Yes                       |
| Respects Changes    | Yes                       |
| Button Still Works  | Yes                       |
| Errors Shown        | Yes                       |

---

**Version:** 1.1.0  
**Status:** ✅ Complete  
**Date:** November 5, 2025
