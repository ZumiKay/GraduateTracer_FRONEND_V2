# Tailwind CSS Cleaner - Best Practices Guide

## 🎯 Problem: Messy Tailwind Classes

**❌ MESSY (Before):**

```tsx
<form className="AddLinkModal w-full h-full bg-white flex flex-col gap-y-5 items-center rounded-md p-2">
  <div className="btn_container w-full h-[30px] flex flex-row gap-x-3">
    <button className="max-w-xs font-bold">Submit</button>
  </div>
  <p className="text-base sm:text-lg font-normal text-foreground/90 leading-relaxed">
    Are you sure?
  </p>
</form>
```

**Issues:**

- Hard to read and maintain
- Difficult to reuse
- Classes scattered across JSX
- Hard to identify patterns
- Difficult to update consistently

---

## ✅ Solutions: 6 Approaches to Clean Tailwind

### **Approach 1: CSS @apply (RECOMMENDED FOR COMPLEX COMPONENTS)**

**Best for:** Complex, frequently used component styles

**CSS File** (`styles/components.css`):

```css
@layer components {
  .form-container {
    @apply w-full h-full bg-white flex flex-col gap-y-5 items-center rounded-md p-2;
  }

  .button-group {
    @apply flex gap-x-3 items-center justify-end w-full;
  }

  .responsive-text {
    @apply text-base sm:text-lg font-normal text-foreground/90 leading-relaxed;
  }
}
```

**React Component:**

```tsx
<form className="form-container">
  <div className="button-group">
    <button className="font-bold">Submit</button>
  </div>
  <p className="responsive-text">Are you sure?</p>
</form>
```

**Pros:**

- ✅ Very clean JSX
- ✅ Easy to maintain styles centrally
- ✅ Great for design consistency
- ✅ Works with dark mode and states

**Cons:**

- ❌ Requires CSS file management
- ❌ Harder to debug conditionally

---

### **Approach 2: Style Constants (GOOD FOR REUSABLE PATTERNS)**

**Best for:** Component-level reuse, simple to medium complexity

```tsx
const PAGINATION_STYLES = {
  container: "w-full h-[50px]",
  wrapper: "flex items-center justify-center gap-2 p-2 rounded-lg",
  button:
    "flex items-center justify-center min-w-10 h-10 rounded hover:bg-gray-100",
  buttonActive: "bg-primary text-white hover:bg-primary-600",
  label: "text-sm font-medium text-gray-700",
} as const;

export const Pagination = () => (
  <div className={PAGINATION_STYLES.container}>
    <nav className={PAGINATION_STYLES.wrapper}>
      <button className={PAGINATION_STYLES.buttonActive}>1</button>
    </nav>
  </div>
);
```

**Pros:**

- ✅ Easy to reuse within component
- ✅ Clean JSX
- ✅ Type-safe with TypeScript
- ✅ Single source of truth

**Cons:**

- ❌ Limited to single component
- ❌ Not ideal for sharing across files

---

### **Approach 3: Helper Functions (GOOD FOR CONDITIONAL STYLES)**

**Best for:** Dynamic styling based on props/state

```tsx
const getButtonClass = (
  isActive: boolean = false,
  isDisabled: boolean = false
): string => {
  const base =
    "flex items-center justify-center min-w-10 h-10 rounded transition-colors";
  const state = isActive
    ? "bg-primary text-white hover:bg-primary-600"
    : "bg-gray-100 hover:bg-gray-200";
  const disabled = isDisabled ? "opacity-50 cursor-not-allowed" : "";

  return `${base} ${state} ${disabled}`.trim();
};

export const Button = ({ isActive, isDisabled, onClick }) => (
  <button className={getButtonClass(isActive, isDisabled)} onClick={onClick}>
    Click me
  </button>
);
```

**Pros:**

- ✅ Great for complex conditions
- ✅ Readable and maintainable
- ✅ Type-safe

**Cons:**

- ❌ More code
- ❌ Performance: creates string on each render (unless memoized)

---

### **Approach 4: clsx/classnames Library (BEST FOR CONDITIONALS)**

**Installation:**

```bash
npm install clsx
```

**Usage:**

```tsx
import { clsx } from "clsx";

const getButtonClass = (isActive: boolean, isDisabled: boolean) => {
  return clsx(
    "flex items-center justify-center min-w-10 h-10 rounded transition-colors",
    {
      "bg-primary text-white hover:bg-primary-600": isActive,
      "bg-gray-100 hover:bg-gray-200": !isActive,
      "opacity-50 cursor-not-allowed": isDisabled,
    }
  );
};
```

**Pros:**

- ✅ Most readable
- ✅ Best for complex conditionals
- ✅ Industry standard
- ✅ Better performance than string concatenation

**Cons:**

- ❌ Requires additional dependency

---

### **Approach 5: Component Composition (BEST FOR REUSABLE UI)**

**Best for:** Building design systems, shared components

```tsx
interface ButtonProps {
  isActive?: boolean;
  isDisabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  isActive = false,
  isDisabled = false,
  variant = "primary",
  children,
}) => {
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <button
      className={clsx(
        "flex items-center justify-center px-4 py-2 rounded transition-colors",
        variants[variant],
        { "opacity-50 cursor-not-allowed": isDisabled }
      )}
      disabled={isDisabled}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );
};

// Usage
<Button variant="primary">Click me</Button>;
```

**Pros:**

- ✅ Maximum reusability
- ✅ Type-safe props
- ✅ Consistent design
- ✅ Easy to extend

**Cons:**

- ❌ More abstraction
- ❌ Might be overkill for simple cases

---

### **Approach 6: Hybrid (RECOMMENDED FOR PRODUCTION)**

**Combine multiple approaches:**

```tsx
// 1. CSS @apply for base styles
// In globals.css:
// @layer components {
//   .pagination { @apply flex items-center gap-2; }
//   .pagination__button { @apply px-3 py-2 rounded transition-colors; }
// }

// 2. Constants for reusable patterns
const PAGINATION_VARIANTS = {
  active: "bg-primary text-white",
  disabled: "opacity-50 cursor-not-allowed",
  default: "bg-gray-100 hover:bg-gray-200",
} as const;

// 3. Helper for complex logic
const getButtonClass = (variant: keyof typeof PAGINATION_VARIANTS) =>
  clsx("pagination__button", PAGINATION_VARIANTS[variant]);

// 4. Component composition for reuse
const PaginationButton: React.FC = ({ variant, children }) => (
  <button className={getButtonClass(variant)}>{children}</button>
);

// Clean JSX
<div className="pagination">
  <PaginationButton variant="default">Prev</PaginationButton>
  <PaginationButton variant="active">1</PaginationButton>
  <PaginationButton variant="default">Next</PaginationButton>
</div>;
```

---

## 📋 Class Naming & Organization

### **Good Class Naming Convention**

```
Namespace → Element → Modifier

.pagination__button--active
 ↑          ↑        ↑
 ns         elem     mod
```

**Examples:**

- ✅ `.form-container` - clear purpose
- ✅ `.button-group` - semantic name
- ✅ `.pagination__button` - BEM convention
- ❌ `.btn1` - unclear
- ❌ `.flex-col-gap-5` - too specific
- ❌ `.wrapper-div-main` - vague

### **Class Ordering Convention**

Order: **Layout → Spacing → Sizing → Typography → Colors → Effects → States**

```tsx
className =
  "flex items-center justify-center gap-4 p-4 w-full text-lg font-bold text-white bg-blue-500 rounded shadow hover:shadow-lg";
// ↑layout   ↑layout           ↑layout ↑spacing ↑spacing ↑sizing  ↑type   ↑type    ↑type    ↑colors ↑colors ↑effects ↑states
```

---

## ✅ DO's & ❌ DON'Ts

### ✅ DO:

- Extract long className strings to constants
- Use CSS @apply for complex component styles
- Create helper functions for conditional logic
- Use semantic class names
- Keep className strings short and focused
- Order classes logically
- Use component composition for reusable UI
- Document complex style logic
- Use design tokens (colors, spacing, etc.)
- Test different states (hover, active, disabled)

### ❌ DON'T:

- Mix 20+ classes in a single className prop
- Use unclear abbreviations or magic numbers
- Repeat the same class combinations
- Nest too many conditional ternaries in className
- Use arbitrary values excessively (`w-[312px]`)
- Forget about responsive classes
- Hardcode colors (use design tokens)
- Make inline styles for dynamic values (use className)
- Ignore accessibility (use aria-\* attributes)
- Mix utility classes with custom CSS inconsistently

---

## 🚀 Quick Migration Guide

### **Step 1: Identify Messy Classes**

```tsx
// Find these patterns:
// - More than 8 classes in one element
// - Repeated class combinations
// - Complex conditional logic
```

### **Step 2: Choose Approach**

- Small component → Constants
- Complex component → CSS @apply
- Conditional logic → Helper function + clsx
- Reusable component → Composition

### **Step 3: Extract Classes**

```tsx
// Before
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
  Submit
</button>

// After
<button className={clsx(BUTTON_STYLES.base, BUTTON_STYLES.primary)}>
  Submit
</button>
```

### **Step 4: Test & Verify**

- Check all states (hover, active, disabled, etc.)
- Test responsive breakpoints
- Verify dark mode (if applicable)

---

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [clsx GitHub](https://github.com/lukeed/clsx)
- [BEM Naming Convention](http://getbem.com/)
- [Tailwind Configuration](https://tailwindcss.com/docs/configuration)

---

## 💡 Example File

See `src/component/Navigator/PaginationComponent.tsx` for practical examples of all approaches.
