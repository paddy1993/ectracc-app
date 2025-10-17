# Delete Button Fix

## Issue

The delete button in the History page was not working when users tried to delete footprint entries. Users would click the "Delete" button in the confirmation dialog, but the entry would not be deleted.

## Root Cause

The issue was caused by an **API endpoint path mismatch** in the `optimisticUI.ts` service:

### Incorrect Paths (Before Fix)
- **optimisticUI.ts** was sending DELETE requests to: `/api/user-footprints/entries/${id}` (plural "entries")
- **optimisticUI.ts** was sending PUT requests to: `/api/user-footprints/entries/${id}` (plural "entries")

### Correct Path
- **Backend route** (`ectracc-backend/routes/user-footprints.js`) expects: `/api/user-footprints/entry/${id}` (singular "entry")
- **userFootprintApi.ts** correctly uses: `/api/user-footprints/entry/${id}` (singular "entry")

The mismatch meant that delete and update requests were being sent to non-existent endpoints, causing the operations to fail silently.

## Solution

Fixed the API endpoint paths in `src/services/optimisticUI.ts`:

### Change 1: Delete Entry Method (Line 259)
```typescript
// Before
const response = await fetch(`/api/user-footprints/entries/${action.data.id}`, {

// After
const response = await fetch(`/api/user-footprints/entry/${action.data.id}`, {
```

### Change 2: Update Entry Method (Line 274)
```typescript
// Before
const response = await fetch(`/api/user-footprints/entries/${action.data.id}`, {

// After
const response = await fetch(`/api/user-footprints/entry/${action.data.id}`, {
```

## Files Modified

- `src/services/optimisticUI.ts` - Fixed API endpoint paths for delete and update operations

## Testing

To verify the fix:

1. Navigate to the History page
2. Click the delete (trash) icon on any entry
3. Confirm deletion in the dialog
4. The entry should now be successfully deleted and removed from the list

## Additional Notes

The `userFootprintApi.ts` service was already using the correct endpoint path, which is why direct API calls (not using optimistic UI) would have worked. The issue only affected the optimistic UI sync operations.

