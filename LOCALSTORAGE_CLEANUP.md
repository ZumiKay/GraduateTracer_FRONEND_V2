# LocalStorage Cleanup Functions

## Overview

Two utility functions have been added to `helperFunc.ts` for managing localStorage cleanup based on formId and userKey.

## Functions

### 1. `cleanupUnrelatedLocalStorage`

Deletes all localStorage items that **DON'T belong** to the specified formId and userKey.

#### Usage

```typescript
import { cleanupUnrelatedLocalStorage } from "./helperFunc";

// Keep only items for formId "123" and userKey "user@example.com"
const result = cleanupUnrelatedLocalStorage({
  formId: "123",
  userKey: "user@example.com",
});

console.log(`Deleted: ${result.deletedCount} items`);
console.log(`Kept: ${result.keptCount} items`);
console.log(`Deleted keys:`, result.deletedKeys);
```

#### Parameters

- `formId` (string, required): The form ID to keep
- `userKey` (string, optional): The user key to keep. If provided, only items matching both formId AND userKey are kept

#### Returns

```typescript
{
  deletedCount: number;     // Number of items deleted
  deletedKeys: string[];    // Array of deleted key names
  keptCount: number;        // Number of items kept
}
```

#### Use Cases

- When switching forms, clean up old form data
- When user logs in, remove other users' data
- Periodic cleanup to prevent localStorage bloat

---

### 2. `deleteFormLocalStorage`

Deletes all localStorage items that **DO belong** to the specified formId and userKey.

#### Usage

```typescript
import { deleteFormLocalStorage } from "./helperFunc";

// Delete all items for formId "123" and userKey "user@example.com"
const result = deleteFormLocalStorage({
  formId: "123",
  userKey: "user@example.com",
});

console.log(`Deleted: ${result.deletedCount} items`);
console.log(`Deleted keys:`, result.deletedKeys);
```

#### Parameters

- `formId` (string, required): The form ID to delete
- `userKey` (string, optional): The user key to delete. If omitted, deletes all items for the formId regardless of userKey

#### Returns

```typescript
{
  deletedCount: number;     // Number of items deleted
  deletedKeys: string[];    // Array of deleted key names
}
```

#### Use Cases

- User logs out - delete their form progress
- User abandons form - clean up their data
- Form submission complete - remove temporary data
- Reset form progress

---

## Storage Key Pattern

Both functions work with keys following this pattern:

```
form_progress_{formId}_{userKey}_{suffix}
form_progress_{formId}_{suffix}  (when no userKey)
```

### Examples:

- `form_progress_abc123_user@example.com_state`
- `form_progress_abc123_user@example.com_responses`
- `form_progress_abc123_progress`
- `form_progress_xyz456_guest_session`

---

## Examples

### Example 1: Switch to New Form

```typescript
// User navigates to form "newFormId"
// Keep only data for the new form and current user
cleanupUnrelatedLocalStorage({
  formId: "newFormId",
  userKey: "current.user@email.com",
});
```

### Example 2: User Logout

```typescript
// Delete all data for the logged-out user across all forms
const allKeys = Object.keys(localStorage);
allKeys.forEach((key) => {
  if (key.includes("user@example.com")) {
    localStorage.removeItem(key);
  }
});

// Or delete for specific form
deleteFormLocalStorage({
  formId: "currentFormId",
  userKey: "user@example.com",
});
```

### Example 3: Form Submission Complete

```typescript
// Remove all temporary data for completed form
deleteFormLocalStorage({
  formId: "completedFormId",
  userKey: "user@example.com",
});
```

### Example 4: Guest Session Cleanup

```typescript
// Keep only current guest session
cleanupUnrelatedLocalStorage({
  formId: "currentFormId",
  // No userKey = keep all items for this form
});
```

### Example 5: Periodic Maintenance

```typescript
// Run on app initialization
// Keep only current form and user data
const currentFormId = getCurrentFormId();
const currentUserEmail = getCurrentUserEmail();

if (currentFormId && currentUserEmail) {
  const result = cleanupUnrelatedLocalStorage({
    formId: currentFormId,
    userKey: currentUserEmail,
  });

  console.log(`Cleaned up ${result.deletedCount} old items`);
}
```

---

## Error Handling

Both functions include try-catch error handling and will return empty results if an error occurs:

```typescript
{
  deletedCount: 0,
  deletedKeys: [],
  keptCount: 0  // (cleanupUnrelatedLocalStorage only)
}
```

Errors are logged to console for debugging.

---

## Performance Considerations

- Both functions iterate through all localStorage keys
- Only keys starting with `form_progress_` are processed
- Operations are synchronous but generally fast
- Consider running cleanup during idle time or on specific events rather than continuously

---

## Integration Points

### Recommended places to call these functions:

1. **On Login/Logout**

   ```typescript
   // After login - cleanup other users' data
   cleanupUnrelatedLocalStorage({ formId, userKey: user.email });

   // On logout - delete current user's data
   deleteFormLocalStorage({ formId, userKey: user.email });
   ```

2. **On Form Navigation**

   ```typescript
   // When switching forms
   cleanupUnrelatedLocalStorage({ formId: newFormId, userKey });
   ```

3. **On Form Submission**

   ```typescript
   // After successful submission
   deleteFormLocalStorage({ formId, userKey });
   ```

4. **On Session Expiry**

   ```typescript
   // When guest session expires
   deleteFormLocalStorage({ formId });
   ```

5. **Application Initialization**
   ```typescript
   // On app startup - optional cleanup
   useEffect(() => {
     if (currentFormId && currentUser) {
       cleanupUnrelatedLocalStorage({
         formId: currentFormId,
         userKey: currentUser.email,
       });
     }
   }, []);
   ```
