# Delete Button Fix

## Issue

The delete button in the History page was not working when users tried to delete footprint entries. Users would click the "Delete" button in the confirmation dialog, but the entry would not be deleted.

## Root Causes

There were **two separate issues** causing the delete button to fail:

### Issue 1: API Endpoint Path Mismatch (Frontend)
- **optimisticUI.ts** was sending DELETE requests to: `/api/user-footprints/entries/${id}` (plural "entries")
- **optimisticUI.ts** was sending PUT requests to: `/api/user-footprints/entries/${id}` (plural "entries")
- **Backend route** expects: `/api/user-footprints/entry/${id}` (singular "entry")
- The path mismatch meant requests were sent to non-existent endpoints

### Issue 2: Missing MongoDB ObjectId Conversion (Backend)
- **UserFootprint.js** model was using `_id: entryId` directly in queries
- MongoDB requires ObjectId type for `_id` field, but `entryId` was a string
- Other models like `PendingProduct.js` and `Product.js` correctly use `new ObjectId(id)`
- This caused MongoDB queries to fail silently with no matches

## Solution

### Fix 1: Frontend - API Endpoint Paths (`src/services/optimisticUI.ts`)

**Change 1: Delete Entry Method (Line 259)**
```typescript
// Before
const response = await fetch(`/api/user-footprints/entries/${action.data.id}`, {

// After
const response = await fetch(`/api/user-footprints/entry/${action.data.id}`, {
```

**Change 2: Update Entry Method (Line 274)**
```typescript
// Before
const response = await fetch(`/api/user-footprints/entries/${action.data.id}`, {

// After
const response = await fetch(`/api/user-footprints/entry/${action.data.id}`, {
```

### Fix 2: Backend - MongoDB ObjectId Conversion (`ectracc-backend/models/UserFootprint.js`)

**Change 1: getEntryById Method (Line 229)**
```javascript
// Before
const entry = await footprints.findOne({ _id: entryId });

// After
const { ObjectId } = require('mongodb');
const entry = await footprints.findOne({ _id: new ObjectId(entryId) });
```

**Change 2: updateEntry Method (Line 248)**
```javascript
// Before
const result = await footprints.updateOne(
  { _id: entryId, user_id: userId },

// After
const { ObjectId } = require('mongodb');
const result = await footprints.updateOne(
  { _id: new ObjectId(entryId), user_id: userId },
```

**Change 3: deleteEntry Method (Line 274)**
```javascript
// Before
const result = await footprints.deleteOne({ _id: entryId, user_id: userId });

// After
const { ObjectId } = require('mongodb');
const result = await footprints.deleteOne({ _id: new ObjectId(entryId), user_id: userId });
```

## Files Modified

- `src/services/optimisticUI.ts` - Fixed API endpoint paths for delete and update operations
- `ectracc-backend/models/UserFootprint.js` - Added ObjectId conversion for getEntryById, updateEntry, and deleteEntry methods

## Testing

To verify the fix:

1. Navigate to the History page
2. Click the delete (trash) icon on any entry
3. Confirm deletion in the dialog
4. The entry should now be successfully deleted and removed from the list

## Additional Notes

The `userFootprintApi.ts` service was already using the correct endpoint path, which is why direct API calls (not using optimistic UI) would have worked. The issue only affected the optimistic UI sync operations.

