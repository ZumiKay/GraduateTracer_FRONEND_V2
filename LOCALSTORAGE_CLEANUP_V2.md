# LocalStorage Management Suite - Enhanced Documentation

## 🎯 Overview

Comprehensive utility functions for managing, monitoring, and maintaining localStorage with focus on form progress data.

---

## 🚀 Core Functions

### 1. `cleanupUnrelatedLocalStorage` ⭐ **IMPROVED**

Intelligently deletes localStorage items that don't belong to specified formId and userKey.

#### ✨ New Features

- ✅ **Dry Run Mode**: Preview changes before deletion
- ✅ **Suffix Filtering**: Target specific data types
- ✅ **Enhanced Returns**: Get both deleted AND kept keys
- ✅ **Clear Logic**: Improved decision-making algorithm

#### 📝 Usage Examples

```typescript
import { cleanupUnrelatedLocalStorage } from "./helperFunc";

// Example 1: Basic cleanup - keep only current form/user
const result = cleanupUnrelatedLocalStorage({
  formId: "form123",
  userKey: "user@example.com",
});

console.log(`✅ Kept: ${result.keptCount} items`);
console.log(`🗑️  Deleted: ${result.deletedCount} items`);
console.log(`Kept keys:`, result.keptKeys);
console.log(`Deleted keys:`, result.deletedKeys);

// Example 2: Dry run to preview changes (SAFE!)
const preview = cleanupUnrelatedLocalStorage({
  formId: "form123",
  userKey: "user@example.com",
  dryRun: true, // ⚠️ Won't actually delete anything
});
// Check console for: [DRY RUN] Would delete: [...]

// Example 3: Target specific suffix
const stateCleanup = cleanupUnrelatedLocalStorage({
  formId: "form123",
  userKey: "user@example.com",
  suffix: "state", // Only cleanup "state" items
});

// Example 4: Keep all users for a form
const formCleanup = cleanupUnrelatedLocalStorage({
  formId: "form123",
  // No userKey = keep all users for this form
});
```

#### 📥 Parameters

| Parameter | Type    | Required | Description                   |
| --------- | ------- | -------- | ----------------------------- |
| `formId`  | string  | ✅ Yes   | Form ID to keep               |
| `userKey` | string  | ❌ No    | User key to keep              |
| `suffix`  | string  | ❌ No    | Target specific suffix        |
| `dryRun`  | boolean | ❌ No    | Preview mode (default: false) |

#### 📤 Returns

```typescript
{
  deletedCount: number;     // Number of items deleted
  deletedKeys: string[];    // Array of deleted key names
  keptCount: number;        // Number of items kept
  keptKeys: string[];       // Array of kept key names (NEW!)
}
```

---

### 2. `getLocalStorageStats` 📊 **NEW**

Get comprehensive analytics about localStorage usage.

#### 📝 Usage

```typescript
import { getLocalStorageStats } from "./helperFunc";

const stats = getLocalStorageStats();

console.log(`📦 Total keys: ${stats.totalKeys}`);
console.log(`📋 Form progress keys: ${stats.formProgressKeys}`);
console.log(`💾 Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
console.log(
  `📊 Form progress size: ${(stats.formProgressSize / 1024).toFixed(2)} KB`
);

// See distribution by form
console.log("By Form:", stats.keysByForm);
// Output: { "form1": 5, "form2": 3 }

// See distribution by user
console.log("By User:", stats.keysByUser);
// Output: { "user@example.com": 4, "guest": 2 }

// Check age of data
if (stats.oldestTimestamp) {
  const age = Date.now() - stats.oldestTimestamp;
  const days = Math.floor(age / (24 * 60 * 60 * 1000));
  console.log(`📅 Oldest data: ${days} days old`);
}
```

#### 📤 Returns

```typescript
{
  totalKeys: number;                    // Total localStorage keys
  formProgressKeys: number;             // Keys with form_progress_ prefix
  totalSize: number;                    // Total size in bytes
  formProgressSize: number;             // Form progress items size in bytes
  keysByForm: Record<string, number>;   // Count per formId
  keysByUser: Record<string, number>;   // Count per userKey
  oldestTimestamp?: number;             // Oldest timestamp found (ms)
  newestTimestamp?: number;             // Newest timestamp found (ms)
}
```

#### 🎯 Use Cases

- 📊 Display storage metrics to users
- 🔍 Debug storage issues
- ⚠️ Warn users about storage limits
- 📈 Monitor storage growth over time

---

### 3. `cleanupOldLocalStorage` 🧹 **NEW**

Automatically remove stale localStorage items based on age.

#### 📝 Usage

```typescript
import { cleanupOldLocalStorage } from "./helperFunc";

// Delete items older than 7 days (default)
const result = cleanupOldLocalStorage();
console.log(`🗑️ Deleted ${result.deletedCount} old items`);

// Delete items older than 24 hours
const dayOld = cleanupOldLocalStorage(24 * 60 * 60 * 1000);

// Delete items older than 30 days
const monthOld = cleanupOldLocalStorage(30 * 24 * 60 * 60 * 1000);

// Delete items older than 1 hour
const hourOld = cleanupOldLocalStorage(60 * 60 * 1000);

// Recommended: Run periodically
setInterval(() => {
  const result = cleanupOldLocalStorage(7 * 24 * 60 * 60 * 1000);
  if (result.deletedCount > 0) {
    console.log(`🧹 Cleaned up ${result.deletedCount} old items`);
  }
}, 24 * 60 * 60 * 1000); // Daily cleanup
```

#### 📥 Parameters

| Parameter  | Type   | Required | Default            | Description                 |
| ---------- | ------ | -------- | ------------------ | --------------------------- |
| `maxAgeMs` | number | ❌ No    | 604800000 (7 days) | Maximum age in milliseconds |

#### 📤 Returns

```typescript
{
  deletedCount: number;     // Number of items deleted
  deletedKeys: string[];    // Array of deleted key names
}
```

#### ⚠️ Important

Only deletes items that have a `timestamp` or `timeStamp` field in their JSON data.

---

### 4. `listLocalStorageItems` 📋 **NEW**

Get detailed inventory of all localStorage items for debugging.

#### 📝 Usage

```typescript
import { listLocalStorageItems } from "./helperFunc";

// List all form progress items
const items = listLocalStorageItems();

// List all localStorage items
const allItems = listLocalStorageItems("");

// Display detailed information
items.forEach((item) => {
  console.log(`📦 Key: ${item.key}`);
  console.log(`   Size: ${item.size} bytes`);
  console.log(`   Form: ${item.formId || "N/A"}`);
  console.log(`   User: ${item.userKey || "N/A"}`);
  console.log(`   Suffix: ${item.suffix || "N/A"}`);

  if (item.hasTimestamp && item.age) {
    const minutes = Math.floor(item.age / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      console.log(`   Age: ${days} days old`);
    } else if (hours > 0) {
      console.log(`   Age: ${hours} hours old`);
    } else {
      console.log(`   Age: ${minutes} minutes old`);
    }
  }
  console.log("---");
});

// Find large items
const largeItems = items.filter((item) => item.size > 50000); // > 50KB
console.log(`⚠️ Found ${largeItems.length} large items`);

// Find old items
const oldItems = items.filter((item) => {
  if (!item.age) return false;
  return item.age > 7 * 24 * 60 * 60 * 1000; // > 7 days
});
console.log(`📅 Found ${oldItems.length} items older than 7 days`);
```

#### 📥 Parameters

| Parameter      | Type   | Required | Default          | Description           |
| -------------- | ------ | -------- | ---------------- | --------------------- |
| `filterPrefix` | string | ❌ No    | "form*progress*" | Prefix to filter keys |

#### 📤 Returns

```typescript
Array<{
  key: string; // Storage key
  size: number; // Size in bytes
  formId?: string; // Extracted formId
  userKey?: string; // Extracted userKey
  suffix?: string; // Extracted suffix
  hasTimestamp: boolean; // Whether item has timestamp
  age?: number; // Age in milliseconds
}>;
```

---

### 5. `deleteFormLocalStorage` 🗑️

Delete all localStorage items for specific form and user.

#### 📝 Usage

```typescript
import { deleteFormLocalStorage } from "./helperFunc";

// Delete all items for specific form and user
const result = deleteFormLocalStorage({
  formId: "form123",
  userKey: "user@example.com",
});

console.log(`Deleted ${result.deletedCount} items`);

// Delete all items for a form (all users)
const allUsers = deleteFormLocalStorage({
  formId: "form123",
  // No userKey = delete for all users
});
```

---

### 6. `clearAllStateLocalStorage` 🧹

Remove state localStorage for specific form and user.

#### 📝 Usage

```typescript
import { clearAllStateLocalStorage } from "./helperFunc";

const success = clearAllStateLocalStorage({
  formId: "form123",
  userKey: "user@example.com",
});

if (success) {
  console.log("✅ State cleared successfully");
}
```

---

## 🧠 Logic Deep Dive

### `cleanupUnrelatedLocalStorage` Decision Algorithm

```
For each localStorage key:

  Step 1: Parse key components
    - Extract formId, userKey, suffix
    - Skip if parse fails

  Step 2: Check matches
    - isMatchingForm = (key.formId === targetFormId)
    - isMatchingUser = (!targetUserKey OR key.userKey === targetUserKey)
    - isSuffixMatch = (!targetSuffix OR key.suffix === targetSuffix)

  Step 3: Decide keep vs delete
    IF formId matches AND userKey matches:
      IF suffix filter is set:
        KEEP only if suffix matches
      ELSE:
        KEEP (no suffix filter)
    ELSE (different form or user):
      IF suffix filter is set:
        DELETE only if suffix matches
      ELSE:
        DELETE (no suffix filter)
```

### 📊 Decision Examples

**Scenario 1: Keep specific form and user**

```typescript
cleanupUnrelatedLocalStorage({
  formId: "form1",
  userKey: "user1",
});
```

- ✅ KEEPS: `form_progress_form1_user1_*` (all suffixes)
- 🗑️ DELETES: Everything else (other forms, other users)

**Scenario 2: Keep specific form, all users**

```typescript
cleanupUnrelatedLocalStorage({
  formId: "form1",
  // No userKey
});
```

- ✅ KEEPS: `form_progress_form1_*` (any user, all suffixes)
- 🗑️ DELETES: `form_progress_form2_*`, `form_progress_form3_*`, etc.

**Scenario 3: Cleanup specific suffix only**

```typescript
cleanupUnrelatedLocalStorage({
  formId: "form1",
  userKey: "user1",
  suffix: "state",
});
```

- ✅ KEEPS: `form_progress_form1_user1_state`
- 🗑️ DELETES: All other `*_state` items
- ⏭️ IGNORES: Items with other suffixes (responses, progress, etc.)

---

## 🎯 Common Use Cases

### Use Case 1: User Login Cleanup

```typescript
// When user logs in, clean up other users' data
function onUserLogin(userId: string, currentFormId: string) {
  const result = cleanupUnrelatedLocalStorage({
    formId: currentFormId,
    userKey: userId,
    dryRun: false,
  });

  console.log(`Cleaned up ${result.deletedCount} items from other users`);
}
```

### Use Case 2: Form Navigation Cleanup

```typescript
// When switching to a new form
function onFormChange(newFormId: string, userId: string) {
  const result = cleanupUnrelatedLocalStorage({
    formId: newFormId,
    userKey: userId,
  });

  console.log(`Cleaned up ${result.deletedCount} items from old forms`);
}
```

### Use Case 3: Periodic Maintenance

```typescript
// Run daily cleanup of old data
function setupMaintenanceSchedule() {
  // Clean up items older than 30 days
  setInterval(() => {
    const result = cleanupOldLocalStorage(30 * 24 * 60 * 60 * 1000);
    if (result.deletedCount > 0) {
      console.log(`🧹 Maintenance: Deleted ${result.deletedCount} old items`);
    }
  }, 24 * 60 * 60 * 1000); // Run daily
}
```

### Use Case 4: Storage Monitoring Dashboard

```typescript
function displayStorageInfo() {
  const stats = getLocalStorageStats();
  const items = listLocalStorageItems();

  return {
    summary: {
      totalKeys: stats.totalKeys,
      formKeys: stats.formProgressKeys,
      sizeMB: (stats.formProgressSize / 1024 / 1024).toFixed(2),
      forms: Object.keys(stats.keysByForm).length,
      users: Object.keys(stats.keysByUser).length,
    },
    largeItems: items
      .filter((i) => i.size > 100000)
      .sort((a, b) => b.size - a.size),
    oldItems: items
      .filter((i) => i.age && i.age > 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => (b.age || 0) - (a.age || 0)),
  };
}
```

### Use Case 5: Safe Cleanup Before Critical Operation

```typescript
async function beforeFormSubmission(formId: string, userId: string) {
  // Preview what would be deleted
  const preview = cleanupUnrelatedLocalStorage({
    formId,
    userKey: userId,
    dryRun: true,
  });

  console.log(`Preview: Would delete ${preview.deletedCount} items`);

  // User confirms
  if (confirm(`Delete ${preview.deletedCount} items?`)) {
    const result = cleanupUnrelatedLocalStorage({
      formId,
      userKey: userId,
      dryRun: false,
    });
    console.log(`✅ Deleted ${result.deletedCount} items`);
  }
}
```

---

## ⚠️ Best Practices

1. **Always use dry run first** for critical operations
2. **Monitor storage stats** regularly to prevent bloat
3. **Set up periodic cleanup** to remove old data
4. **Log cleanup operations** for debugging
5. **Test cleanup logic** before deploying to production
6. **Be careful with suffix filters** - understand the logic
7. **Consider user experience** - don't delete active session data

---

## 🔧 Performance Tips

- Functions are optimized for performance
- Use suffix filters to reduce processing
- Run maintenance during idle time
- Batch operations when possible
- Monitor localStorage size limits (typically 5-10MB)

---

## 📚 Storage Key Pattern

All functions work with this key pattern:

```
form_progress_{formId}_{userKey}_{suffix}
form_progress_{formId}_{suffix}  (when no userKey)
```

Examples:

- `form_progress_abc123_user@example.com_state`
- `form_progress_abc123_user@example.com_responses`
- `form_progress_abc123_progress`
- `form_progress_xyz456_guest_session`

---

## 🆘 Troubleshooting

**Problem**: Cleanup deleted too much

- **Solution**: Always use `dryRun: true` first

**Problem**: Can't find old items

- **Solution**: Check if items have `timestamp` or `timeStamp` field

**Problem**: Performance issues

- **Solution**: Use suffix filters or cleanup during idle time

**Problem**: Storage still full

- **Solution**: Check stats with `getLocalStorageStats()` to identify large items

---

## 📝 Change Log

### Version 2.0 - Enhanced Suite

- ✅ Added dry run mode
- ✅ Added suffix filtering
- ✅ Added kept keys in return
- ✅ Improved decision logic
- ✅ Added stats function
- ✅ Added old data cleanup
- ✅ Added list function
- ✅ Enhanced documentation
