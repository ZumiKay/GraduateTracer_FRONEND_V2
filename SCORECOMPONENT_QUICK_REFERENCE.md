# ScoreComponent - Quick Reference

## 🎯 One-Minute Overview

`ScoreModeInput` is a complete, production-ready score input component that:

- ✅ Validates score input (range, type, format)
- ✅ Provides real-time visual feedback (progress bar, percentage)
- ✅ Shows completion status with checkmark icon
- ✅ Accepts optional feedback/comment (500 char limit)
- ✅ Prevents invalid submissions
- ✅ Fully accessible and responsive

## 📥 Import & Usage

```tsx
import { ScoreModeInput } from "@/component/FormComponent/Solution/ScoreComponent";

<ScoreModeInput
  maxScore={100}
  initialScore={0}
  initialComment=""
  onScoreChange={(data) => {
    console.log(data.score, data.comment);
  }}
/>;
```

## 🔧 Props

| Prop             | Type       | Required | Default | Description                 |
| ---------------- | ---------- | -------- | ------- | --------------------------- |
| `maxScore`       | `number`   | ✅       | -       | Maximum score allowed       |
| `onScoreChange`  | `function` | ✅       | -       | Callback: `(data) => {...}` |
| `initialScore`   | `number`   | ❌       | `0`     | Starting score value        |
| `initialComment` | `string`   | ❌       | `""`    | Starting comment text       |

## 📊 States & Colors

| State   | Condition         | Color        | Icon |
| ------- | ----------------- | ------------ | ---- |
| Success | Score ≥ 80%       | 🟢 Green     | ✓    |
| Warning | 50% ≤ Score < 80% | 🟡 Amber     | -    |
| Error   | Score < 50%       | 🔴 Red       | -    |
| Neutral | Score = 0         | ⚪ Gray      | -    |
| Perfect | Score = max       | 🟢 Green + ✓ | ✓    |

## ✅ Validation Rules

| Rule           | Error Message                      |
| -------------- | ---------------------------------- |
| Invalid number | `"Invalid score"`                  |
| Negative score | `"Score cannot be negative"`       |
| Exceeds max    | `"Score cannot exceed {maxScore}"` |

## 🎨 Built-in Features

```
┌─────────────────────────────────────┐
│ ✓ Real-time percentage              │
│ ✓ Color-coded progress bar          │
│ ✓ Smart validation                  │
│ ✓ Character counter (500 limit)     │
│ ✓ Clear error messages              │
│ ✓ Disabled button until valid       │
│ ✓ Perfect score celebration 🎉     │
│ ✓ Fully accessible (ARIA)           │
│ ✓ Mobile responsive                 │
│ ✓ Memoized handlers (performance)   │
└─────────────────────────────────────┘
```

## 📝 Callback Data

```typescript
onScoreChange({
  score: number, // 0-100
  comment: string, // Optional feedback
});
```

## 🎮 User Interactions

1. **Enter Score** → Input validates → Color updates → % shown
2. **(Optional) Add Comment** → Counter tracks → Up to 500 chars
3. **Click Save** → Callback fires → Parent receives data

## 🚫 Button States

| State    | When                       | Appearance          |
| -------- | -------------------------- | ------------------- |
| Enabled  | Changes made + No errors   | Blue, clickable     |
| Disabled | No changes OR Error exists | Gray, not clickable |

## 🎯 Perfect Score Trigger

When `score === maxScore`:

- ✓ Checkmark icon appears
- 🎉 Message shows: "Perfect score achieved! 🎉"
- 🟢 Progress bar fills 100%
- 🟢 Color turns green

## 🔄 Component Lifecycle

```
Mount
  ↓ (initialScore, initialComment)
  ↓
Interactive State
  ↓ (User enters score/comment)
  ↓ (Real-time validation & feedback)
  ↓
Save
  ↓ (Click button)
  ↓
onScoreChange() called
  ↓
Reset to saved state
```

## 📱 Responsive Behavior

- **Desktop** (≥768px): Compact layout with score % on same line
- **Mobile** (<768px): Stacked layout for better touch experience

## ♿ Accessibility

- ✓ ARIA labels on inputs
- ✓ Semantic HTML structure
- ✓ Keyboard navigable
- ✓ Error messages linked to inputs
- ✓ Proper heading hierarchy
- ✓ Color not only differentiator (icons + text)

## 🔗 Dependencies

```json
"@heroui/react": "^2.8.1",
"@heroicons/react": "^2.2.0",
"react": "^18.3.1"
```

## 💡 Tips & Tricks

### 1. **Custom Max Score**

```tsx
<ScoreModeInput maxScore={50} onScoreChange={...} />  // Max: 50
<ScoreModeInput maxScore={1000} onScoreChange={...} /> // Max: 1000
```

### 2. **Pre-filled Values**

```tsx
<ScoreModeInput
  maxScore={100}
  initialScore={85}
  initialComment="Great work!"
  onScoreChange={...}
/>
```

### 3. **In a Form**

```tsx
<form onSubmit={handleFormSubmit}>
  <ScoreModeInput maxScore={100} onScoreChange={setScore} />
  <button type="submit">Submit Grade</button>
</form>
```

### 4. **With Multiple Instances**

```tsx
{
  questions.map((q) => (
    <ScoreModeInput
      key={q.id}
      maxScore={q.points}
      onScoreChange={(data) => updateScore(q.id, data)}
    />
  ));
}
```

## 🐛 Debugging

| Issue                  | Solution                               |
| ---------------------- | -------------------------------------- |
| Score not updating     | Check `onChange` handler               |
| Button always disabled | Verify `onScoreChange` callback exists |
| No validation error    | Check if score is valid range          |
| Styles not showing     | Ensure Tailwind CSS configured         |

## 📖 Full Documentation

- See `SCORECOMPONENT_DOCUMENTATION.md` for detailed features
- See `SCORECOMPONENT_VISUAL_GUIDE.md` for visual diagrams
- See `SCORECOMPONENT_IMPLEMENTATION_SUMMARY.md` for full overview

## 🚀 Production Checklist

- [x] Fully typed with TypeScript
- [x] No ESLint errors
- [x] Accessible (WCAG 2.1 AA)
- [x] Responsive design
- [x] Performance optimized
- [x] Error handling complete
- [x] Documentation complete
- [x] Ready for production

## 📞 Support

For issues or questions:

1. Check component props are correct
2. Verify Tailwind CSS is configured
3. Check console for errors
4. Review SCORECOMPONENT_DOCUMENTATION.md

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** November 5, 2025
