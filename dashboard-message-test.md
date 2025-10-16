# Dashboard Empty State Message Test Cases

## Test Scenario 1: New User (Never Tracked Products)
**Setup:**
- User just signed up
- No products tracked ever
- Clicks "DAY" filter

**Expected Result:**
- Title: "Welcome to Your Carbon Footprint Journey!"
- Description: "You haven't tracked any products yet. Start building your carbon footprint awareness by scanning a barcode or adding your first product manually."

**Logic:**
```javascript
allTimeSummary.totalEntries = 0
hasAllTimeEntries = false
→ Returns new user message
```

---

## Test Scenario 2: Existing User - No Products Today
**Setup:**
- User has tracked 10 products in the past week
- No products tracked today
- Clicks "DAY" filter

**Expected Result:**
- Title: "Welcome to Your Carbon Footprint Journey!"
- Description: "You haven't tracked any products **today**. Build your carbon footprint awareness by scanning a barcode or adding a product manually."

**Logic:**
```javascript
allTimeSummary.totalEntries = 10
hasAllTimeEntries = true
summary.totalEntries = 0 (for today)
timeFilter = 'day'
→ Returns "You haven't tracked any products today..."
```

---

## Test Scenario 3: Existing User - No Products This Week
**Setup:**
- User has tracked products last month
- No products tracked this week
- Clicks "WEEK" filter

**Expected Result:**
- Title: "Welcome to Your Carbon Footprint Journey!"
- Description: "You haven't tracked any products **this week**. Build your carbon footprint awareness by scanning a barcode or adding a product manually."

**Logic:**
```javascript
allTimeSummary.totalEntries > 0
hasAllTimeEntries = true
summary.totalEntries = 0 (for this week)
timeFilter = 'week'
→ Returns "You haven't tracked any products this week..."
```

---

## Test Scenario 4: Existing User - No Products This Month
**Setup:**
- User has tracked products in previous months
- No products tracked this month
- Clicks "MONTH" filter

**Expected Result:**
- Title: "Welcome to Your Carbon Footprint Journey!"
- Description: "You haven't tracked any products **this month**. Build your carbon footprint awareness by scanning a barcode or adding a product manually."

**Logic:**
```javascript
allTimeSummary.totalEntries > 0
hasAllTimeEntries = true
summary.totalEntries = 0 (for this month)
timeFilter = 'month'
→ Returns "You haven't tracked any products this month..."
```

---

## Test Scenario 5: Existing User - No Products This Year
**Setup:**
- User has tracked products in previous years
- No products tracked this year
- Clicks "YTD" or "YEAR" filter

**Expected Result:**
- Title: "Welcome to Your Carbon Footprint Journey!"
- Description: "You haven't tracked any products **this year**. Build your carbon footprint awareness by scanning a barcode or adding a product manually."

**Logic:**
```javascript
allTimeSummary.totalEntries > 0
hasAllTimeEntries = true
summary.totalEntries = 0 (for this year)
timeFilter = 'ytd' or 'year'
→ Returns "You haven't tracked any products this year..."
```

---

## Test Scenario 6: User Has Products in Current Period
**Setup:**
- User has tracked products today
- Clicks "DAY" filter

**Expected Result:**
- **No empty state shown**
- Dashboard displays normal content with stats and charts

**Logic:**
```javascript
summary.totalEntries > 0
hasEntries = true
→ Empty state is not rendered, main dashboard content shows
```

---

## Code Implementation

The key logic in `getEmptyStateMessage()`:

```typescript
const getEmptyStateMessage = () => {
  if (!hasAllTimeEntries) {
    // User has never tracked any products
    return {
      title: "Welcome to Your Carbon Footprint Journey!",
      description: "You haven't tracked any products yet. Start building your carbon footprint awareness by scanning a barcode or adding your first product manually."
    };
  }
  
  // User has tracked products before, but not in current time period
  const timeLabels = {
    'day': 'today',
    'week': 'this week',
    'month': 'this month',
    'ytd': 'this year',
    'year': 'this year'
  };
  
  const timeLabel = timeLabels[timeFilter] || 'in this period';
  
  return {
    title: "Welcome to Your Carbon Footprint Journey!",
    description: `You haven't tracked any products ${timeLabel}. Build your carbon footprint awareness by scanning a barcode or adding a product manually.`
  };
};
```

## Verification Steps

1. **New User Test:**
   - Create new account
   - Navigate to dashboard
   - Check each time filter (DAY, WEEK, MONTH, YTD, YEAR)
   - Should see "You haven't tracked any products yet" for all filters

2. **Existing User Test:**
   - Use account with historical data
   - Navigate to dashboard
   - Click "DAY" (assuming no products today)
   - Should see "You haven't tracked any products today"
   - Click "WEEK" (assuming no products this week)
   - Should see "You haven't tracked any products this week"

3. **Has Current Period Data Test:**
   - Add a product entry
   - Click "DAY"
   - Should see normal dashboard with stats (no empty state)

