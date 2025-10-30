# Page Input Field - Visual Reference Guide

## 📱 Component Layout

### **Desktop View (Full Feature)**

```
┌────────────────────────────────────────────────────────────┐
│  ← │ 1 ... 4 5 6 ... 10 │ → │ Go to: [5] / 10 │ 5 / 10  │
└────────────────────────────────────────────────────────────┘
     ↑                      ↑   ↑
  Navigation         INPUT FIELD  Info Display
```

### **Mobile View (Input Hidden)**

```
┌──────────────────────────┐
│ ← │ 1 ... 5 ... 10 │ →   │
└──────────────────────────┘
(Input field hidden with hidden sm:flex)
```

---

## 🎯 Input Field Details

### **Component Structure**

```
┌─────────────────────────────────┐
│ Go to: [5] / 10                 │
├─────────────────────────────────┤
│ Label   Input  Counter          │
│ "Go to:" [Box]  "/ 10"          │
└─────────────────────────────────┘
```

### **Input Field Specs**

```
Width:    48px (w-12)
Height:   32px (h-8)
Padding:  8px (px-2)
Font:     12px (text-xs)
Border:   1px, rounded
Center:   text-center aligned
Focus:    Primary color ring
```

---

## 🎨 Visual States

### **1. Normal State**

```
┌────────┐
│   5    │  ← Gray border, white background
└────────┘
Border: gray-300
Text: gray-700
```

### **2. Hover State**

```
┌────────┐
│   5    │  ← Darker border on hover
└────────┘
Border: gray-400 (darker)
```

### **3. Focus State**

```
┌════════╗
║   5    ║  ← Primary color ring + border
╚════════╝
Ring: primary color (1px)
Border: primary color
```

### **4. Disabled State**

```
┌────────┐
│   5    │  ← 50% opacity, not clickable
└────────┘
Opacity: 50%
Cursor: not-allowed
```

---

## ⌨️ Keyboard Interactions

### **Enter Key**

```
User: Types "25" and presses Enter
┌────────────────────────┐
│ Go to: [25] / 100      │
│ ACTION: Navigate to 25 │
│ INPUT: Shows "25"      │
└────────────────────────┘
```

### **Tab Key (Blur)**

```
User: Types "30" and tabs out
┌────────────────────────┐
│ Go to: [30] / 100      │
│ ACTION: Navigate to 30 │
│ INPUT: Shows "30"      │
└────────────────────────┘
(Or resets if invalid)
```

### **Delete Key**

```
User: Clears field and tabs out
┌────────────────────────┐
│ Go to: [5] / 100       │
│ ACTION: Reset to 5     │
│ INPUT: Shows current   │
└────────────────────────┘
```

---

## 🔄 State Transitions

```
INITIAL:
┌─────────────────┐
│ Go to: [5] / 10 │ ← Shows current page
└─────────────────┘

USER TYPES "25":
┌─────────────────┐
│ Go to: [25] / 10│ ← Live update as typing
└─────────────────┘

PRESS ENTER:
┌─────────────────┐
│ Go to: [25] / 25│ ← Navigate to page 25
└─────────────────┘

PAGE CHANGES EXTERNALLY:
┌─────────────────┐
│ Go to: [25] / 25│ ← Input syncs automatically
└─────────────────┘
```

---

## 📊 Input Validation Flow

```
┌──────────────────┐
│  User Input "99" │
└────────┬─────────┘
         ↓
┌──────────────────────┐
│ Is 1 ≤ 99 ≤ total?   │
└────────┬─────────────┘
    YES  ↓  NO
    ╔════════════════╗
    ║                ║
    ↓                ↓
NAVIGATE        RESET INPUT
To Page 99      To Current
    ↓                ↓
┌─────────────────┐ ┌─────────────────┐
│[99] Success     │ │[5] Reset        │
└─────────────────┘ └─────────────────┘
```

---

## 🎨 Color Scheme

### **Input Field Colors**

```
Default:
  Border:     #E5E7EB (gray-300)
  Background: #FFFFFF (white)
  Text:       #374151 (gray-700)
  Placeholder: (auto)

Hover:
  Border:     #D1D5DB (gray-400)
  Background: #FFFFFF (white)

Focus:
  Border:     #Primary color
  Ring:       #Primary color (1px)
  Background: #FFFFFF (white)

Disabled:
  Opacity:    50%
  Cursor:     not-allowed
  Interactive: No
```

### **Label & Counter Colors**

```
Text Color: #6B7280 (gray-500)
Font Size:  12px (text-xs)
Font Weight: 500 (medium)
```

---

## 📐 Layout Spacing

```
Gap between elements:    4px (gap-1)
Left margin:             8px (ml-2)
Left padding:            8px (pl-2)
Input width:             48px (w-12)
Input height:            32px (h-8)
Input padding (x):       8px (px-2)

Overall container:
Responsive gap:  gap-1 (mobile) sm:gap-2 (desktop)
Padding:         py-4 px-2 (mobile) sm:py-6 (desktop)
```

---

## 🎯 Responsive Breakpoints

### **Mobile (< 640px)**

```
HIDDEN
    │
    └─ hidden class active
    └─ sm:flex = display: none
    └─ No input field visible
```

### **Tablet (640px - 1024px)**

```
VISIBLE
    │
    └─ sm:flex = display: flex
    └─ Full functionality
    └─ Input field visible
```

### **Desktop (> 1024px)**

```
VISIBLE (Full Space)
    │
    └─ sm:flex = display: flex
    └─ Full functionality
    └─ Input field visible
    └─ Optimal spacing
```

---

## 🔤 Typography

```
Label Text:
  Size:   12px (text-xs)
  Weight: 500 (font-medium)
  Color:  #6B7280 (gray-500)
  Content: "Go to:"

Input Text:
  Size:       12px (text-xs)
  Alignment:  center (text-center)
  Color:      #374151 (gray-700)
  Family:     monospace (for numbers)

Counter Text:
  Size:   12px (text-xs)
  Weight: 500 (font-medium)
  Color:  #6B7280 (gray-500)
  Content: "/ 10"
```

---

## 🚀 User Workflows - Visual

### **Workflow 1: Direct Input**

```
1. Focus field
   ↓
   ┌────────┐
   │ [_]    │ ← Cursor in field, focus ring visible
   └────────┘

2. Type page number
   ↓
   ┌────────┐
   │ [25]   │ ← Live input update
   └────────┘

3. Press Enter
   ↓
   Navigate to page 25, input shows "25"
```

### **Workflow 2: Validation**

```
1. Type invalid number (too high)
   ↓
   ┌────────┐
   │ [999]  │ ← User typing
   └────────┘

2. Click outside (blur)
   ↓
   ┌────────┐
   │ [5]    │ ← Resets to current page
   └────────┘
   No navigation occurs
```

### **Workflow 3: Auto-sync**

```
1. User clicks page 10 button
   ↓
   Input: [5]

2. Page changes to 10 (external)
   ↓
   useEffect triggers
   ↓
   Input: [10]
   (Automatically synced)
```

---

## ✨ Feature Highlights

### **Visual Indicators**

```
✓ Clear "Go to:" label
✓ Input field with border
✓ Counter "/ 10" for context
✓ Focus ring for keyboard users
✓ Disabled state (grayed out)
✓ Hover effects for mouse users
```

### **Interactive Elements**

```
✓ Type to input
✓ Enter key to navigate
✓ Blur to validate & navigate
✓ Escape to cancel (built-in)
✓ Tab to next element
✓ Number spinner controls (browser default)
```

---

## 🎓 CSS Reference

### **Key Classes**

```css
Container:
  hidden sm:flex         /* Show only on desktop */
  items-center gap-1     /* Center align, 4px gap */
  ml-2 pl-2             /* Left spacing */
  border-l border-gray-200 /* Left border */

Input:
  w-12 h-8              /* 48x32px */
  px-2 text-xs          /* Padding, font size */
  text-center           /* Center text */
  border rounded        /* 1px border, rounded */
  bg-white              /* White background */
  text-gray-700         /* Gray text */

  Hover:
  hover:border-gray-400 /* Darker border */

  Focus:
  focus:outline-none    /* Remove browser outline */
  focus:ring-1          /* Add custom ring */
  focus:ring-primary    /* Primary color ring */
  focus:border-primary  /* Primary border */

  Disabled:
  disabled:opacity-50   /* 50% opacity */
  disabled:cursor-not-allowed /* Not-allowed cursor */

  Transition:
  transition-all        /* Smooth all effects */

Label & Counter:
  text-xs font-medium   /* 12px, medium weight */
  text-gray-500         /* Gray color */
```

---

## 📊 Before vs After

### **Pagination WITHOUT Input**

```
← │ 1 ... 4 5 6 ... 10 │ → │ 5 / 10
(Can only navigate via buttons)
```

### **Pagination WITH Input**

```
← │ 1 ... 4 5 6 ... 10 │ → │ Go to: [5] / 10 │ 5 / 10
                            └─ NEW FEATURE ──┘
(Can navigate via buttons OR direct input)
```

---

## ✅ Quality Checklist

```
✓ Responsive (hidden/shown correctly)
✓ Accessible (aria-label, semantic)
✓ Validated (input range check)
✓ Synced (useEffect auto-update)
✓ Styled (consistent with component)
✓ Interactive (Enter key, blur handlers)
✓ Disabled (respects isDisable prop)
✓ Performance (no unnecessary re-renders)
✓ Type-safe (TypeScript)
✓ Well-documented (this guide)
```

---

## 🎉 Summary

The page input field is a compact, responsive feature that:

- **Looks** Professional and integrated
- **Works** Intuitively with multiple input methods
- **Validates** All entries automatically
- **Responds** Smoothly to user actions
- **Hides** Gracefully on mobile
- **Syncs** Automatically with state changes

Ready for production! 🚀
