# Grouped View Implementation Summary

## Overview

Added functionality to the Response Table to toggle between **Normal View** (individual responses) and **Grouped View** (responses grouped by respondent email). **Note:** The grouped view toggle is only available when email collection is enabled in form settings (`form.setting.email === true`).

## Changes Made

### 1. **Frontend - Response Service** (`src/services/responseService.ts`)

- Updated `fetchResponseList` to accept a `group` parameter
- Modified `ResponseListResponse` interface to support both `ResponseListItem[]` and `GroupResponseListItemType[]`
- Added `group` parameter to query string when fetching responses

**Key Changes:**

```typescript
interface fetchResponseListParamType {
  // ... existing parameters
  group?: string; // New parameter
}

export interface ResponseListResponse {
  responses: ResponseListItem[] | GroupResponseListItemType[];
  pagination: PaginationType;
}
```

### 2. **Response Dashboard Hook** (`src/component/Response/hooks/useResponseDashboardData.ts`)

- Added `groupBy` parameter to hook interface
- Updated query key to include `groupBy` for proper cache invalidation
- Passes `group` parameter to `fetchResponseList`

**Key Changes:**

```typescript
interface UseFetchResponseDashboardDataType {
  formId: string;
  filterValue?: ResponseDashboardFilterType;
  groupBy?: string; // New parameter
}

interface UseFetchResponseDashboardDataReturn {
  responseList?: Array<ResponseListItem | GroupResponseListItemType>; // Union type
  // ... other properties
}
```

### 3. **Response Table Component** (`src/component/Response/components/ResponseTable.tsx`)

- Added `viewMode`, `onViewModeChange`, and `showGroupToggle` props
- Implemented toggle buttons for switching between Normal and Grouped views (only visible when `showGroupToggle === true`)
- Added type guard `isResponseListItem` to differentiate between response types
- Split table rendering into two modes with conditional rendering
- Updated `handleViewResponse` to handle grouped responses by appending all `responseIds` to query params

**Normal View Columns:**

- Respondent
- Email
- Status
- Submitted At
- Actions (View, Edit Score, Return, Export PDF, Delete)

**Grouped View Columns:**

- Respondent
- Email
- Type
- Response Count
- Actions (View Responses only)

**Key Features:**

```typescript
type ViewMode = "normal" | "grouped";

interface ResponseTableProps {
  // ... other props
  showGroupToggle?: boolean; // Only show toggle if email collection is enabled
}

// Type guard
const isResponseListItem = (
  response: ResponseListItem | GroupResponseListItemType
): response is ResponseListItem => {
  return "_id" in response;
};

// Conditional rendering of toggle buttons
{
  showGroupToggle && <div className="flex gap-2">{/* Toggle buttons */}</div>;
}
```

### 4. **Response List Section** (`src/component/Response/components/ResponseListSection.tsx`)

- Added `tableViewMode` and `onTableViewModeChange` props
- Updated `responseList` type to accept union of `ResponseListItem[]` and `GroupResponseListItemType[]`
- Passes view mode props to ResponseTable
- Conditionally enables group toggle based on `form.setting.email === true`

**Key Changes:**

```typescript
<ResponseTable
  // ... other props
  showGroupToggle={form?.setting?.email === true}
/>
```

### 5. **Response Dashboard** (`src/component/Response/ResponseDashboard.tsx`)

- Added `tableViewMode` state with default value "normal"
- Passes `groupBy: tableViewMode === "grouped" ? "respondentEmail" : undefined` to the data fetching hook
- Passes `tableViewMode` and `setTableViewMode` to ResponseListSection
- Added effect to automatically reset `tableViewMode` to "normal" when email collection is disabled

**Key Changes:**

```typescript
// Reset table view mode to normal if email collection is disabled
useEffect(() => {
  if (form?.setting?.email !== true && tableViewMode === "grouped") {
    setTableViewMode("normal");
  }
}, [form?.setting?.email, tableViewMode]);
```

## User Experience Flow

### Normal View

1. User sees individual response entries
2. Each row represents a single response submission
3. Columns show: Respondent, Email, Status, Submitted At
4. All actions available: View, Edit Score, Return, Export PDF, Delete

### Grouped View

**Prerequisites:** Email collection must be enabled (`form.setting.email === true`)

1. User clicks "Group by Email" button (only visible if email collection is enabled)
2. Table switches to grouped mode
3. Backend aggregates responses by `respondentEmail`
4. Each row represents a group of responses from the same email
5. Columns show: Respondent, Email, Type, Response Count
6. Clicking "View" opens ViewResponsePage with all responses from that group
7. Navigation preserved via `responseIds` query parameter

**Note:** If email collection is disabled while in grouped view, the table automatically switches back to normal view.

## Technical Details

### Type Safety

- Used TypeScript type guards to safely distinguish between `ResponseListItem` and `GroupResponseListItemType`
- Union types ensure proper typing throughout the component tree
- Filter methods with type predicates for type-safe array operations

### Data Flow

```
ResponseDashboard (manages tableViewMode state)
  ↓
  useFetchResponseDashboardData (passes groupBy to API)
    ↓
    fetchResponseList (sends group parameter to backend)
      ↓
      Backend API (returns grouped or normal data)
        ↓
        ResponseListSection (passes view mode to table)
          ↓
          ResponseTable (renders conditionally based on viewMode)
```

### Query Cache Management

- React Query cache includes `groupBy` in query key
- Switching views triggers new fetch with different data structure
- Prevents stale data issues when toggling between modes

## Backend Integration

The frontend expects the backend to:

1. Accept `group` query parameter (e.g., `?group=respondentEmail`)
2. Return `GroupResponseListItemType[]` when group parameter is present
3. Return `ResponseListItem[]` when no group parameter

**GroupResponseListItemType structure:**

```typescript
export interface GroupResponseListItemType {
  respondentEmail?: string;
  respondentName?: string;
  respondentType?: respondentType;
  responseCount?: number;
  responseIds?: Array<string>;
}
```

## Testing Recommendations

1. ✅ Verify toggle between Normal and Grouped views
2. ✅ Check grouped view correctly displays response counts
3. ✅ Confirm clicking grouped item opens all responses in ViewResponsePage
4. ✅ Test navigation between responses in grouped view
5. ✅ Verify filters work correctly in both view modes
6. ✅ Test pagination in both modes
7. ✅ Ensure type safety with TypeScript compilation

## Future Enhancements

- Add more grouping options (by status, by date, by type)
- Implement expand/collapse for grouped items
- Add summary statistics for each group
- Support nested grouping (e.g., by email then by status)
- Add export functionality for grouped data
