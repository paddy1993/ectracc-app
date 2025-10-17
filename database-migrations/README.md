# Database Migrations

This directory contains database migration scripts for ECTRACC.

## Running Migrations

### Prerequisites

1. Ensure MongoDB connection string is set in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/ectracc
   ```

2. Install dependencies:
   ```bash
   cd ectracc-backend
   npm install
   ```

### Execute a Migration

From the project root:

```bash
node database-migrations/002-fix-carbon-units.js
```

## Migration Scripts

### 001-add-admin-role.sql

Adds admin role to user profiles in Supabase.

**Status**: Applied  
**Date**: Previous deployment

### 002-fix-carbon-units.js

Fixes carbon footprint unit conversion issue where manual entries were stored in grams but displayed as kilograms.

**Status**: Ready to apply  
**Date**: 2025-01-15

**What it does:**
- Finds all user footprint entries from `manual_entry` source
- Identifies entries with `carbon_footprint` > 100 kg (likely stored in grams)
- Divides by 1000 to convert from grams to kilograms
- Adds migration metadata to updated records

**Before running:**
- ⚠️ **IMPORTANT**: Deploy frontend and backend code fixes FIRST
- The migration will ask for confirmation before proceeding
- It includes a 5-second delay to allow cancellation (Ctrl+C)

**After running:**
- Verify dashboard displays reasonable values (e.g., "2.8 kg CO₂e" not "2800 kg CO₂e")
- Check that user totals are in expected range
- Review the console output for migration statistics

**Safety features:**
- Only affects records with `carbon_footprint` > 100 kg
- Adds `migration_applied` and `migration_date` fields for tracking
- Shows before/after samples
- Reports final statistics

**To verify results:**

```javascript
// Connect to MongoDB and run:
db.user_footprints.find({
  source: 'manual_entry',
  migration_applied: '002-fix-carbon-units'
}).limit(5);
```

## Creating New Migrations

1. Create a new file: `00X-migration-name.js` or `.sql`
2. Follow the naming convention: `{number}-{description}`
3. Include:
   - Clear documentation of what the migration does
   - Safety checks and validations
   - Rollback instructions if applicable
   - Testing verification steps
4. Update this README with migration details

## Rollback

If you need to rollback migration 002:

```javascript
// Multiply by 1000 for records that were migrated
db.user_footprints.updateMany(
  { migration_applied: '002-fix-carbon-units' },
  {
    $mul: {
      carbon_footprint: 1000,
      carbon_footprint_per_unit: 1000
    },
    $unset: {
      migration_applied: '',
      migration_date: ''
    }
  }
);
```

⚠️ **WARNING**: Only rollback if absolutely necessary and you understand the implications.

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** on development/staging environment first
3. **Deploy code changes** before running data migrations
4. **Document everything** in this README
5. **Include rollback** procedures for safety
6. **Add metadata** to track which records were migrated

