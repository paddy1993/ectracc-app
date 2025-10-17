# ECTRACC Product Database Enrichment Pipeline

This pipeline enriches your existing product database with 11 additional fields from Open Food Facts data while staying within MongoDB storage limits.

## Overview

The enrichment pipeline adds the following fields to your products:

### 📦 Quantity & Measurement
- `quantity` - Package quantity string (e.g., "350 g", "1.5 L")
- `product_quantity` - Numeric quantity value (350, 1.5)
- `product_quantity_unit` - Unit of measure (g, kg, L, ml)
- `net_weight` - Net weight value
- `net_weight_unit` - Net weight unit

### 🏭 Packaging & Manufacturing
- `packaging` - Packaging type information
- `packaging_text` - Detailed packaging description (max 200 chars)
- `origins` - Product origin/source countries (array, max 5 items)
- `manufacturing_places` - Manufacturing locations (array, max 3 items)

### 🏪 Market & Certification
- `labels` - Certification labels (organic, fair trade, etc.) (array, max 5 items)
- `stores` - Where product is sold (array, max 5 items)
- `countries` - Countries where available (array, max 5 items)

## Prerequisites

1. **MongoDB Connection**: Ensure `MONGODB_URI` environment variable is set
2. **Open Food Facts Data**: Download `openfoodfacts-products.jsonl (1).gz` to `~/Desktop/`
3. **DuckDB**: Install DuckDB (`brew install duckdb` on macOS)
4. **Storage Space**: Ensure sufficient MongoDB storage (pipeline monitors 5GB limit)

## Quick Start

### Option 1: Run Complete Pipeline (Recommended)

```bash
# Run the complete enrichment pipeline
node scripts/run-enrichment-pipeline.js
```

This master script will:
1. Export existing product barcodes
2. Analyze field availability in Open Food Facts
3. Extract optimized enrichment data
4. Test on sample dataset (100 products)
5. Ask for confirmation before full enrichment
6. Run full batch enrichment
7. Verify final storage usage

### Option 2: Run Individual Steps

```bash
# Step 1: Export existing barcodes
node scripts/export-existing-barcodes.js

# Step 2: Analyze field availability
node scripts/analyze-openfoodfacts-fields.js

# Step 3: Extract enrichment data
node scripts/extract-enrichment-data.js

# Step 4: Test on sample
node scripts/test-sample-enrichment.js

# Step 5: Run full enrichment (if test passes)
node scripts/batch-enrichment-pipeline.js
```

## Storage Monitoring

Monitor MongoDB storage usage during enrichment:

```bash
# One-time storage check
node scripts/storage-monitor.js

# Continuous monitoring (updates every 30 seconds)
node scripts/storage-monitor.js --continuous

# Custom interval (updates every 60 seconds)
node scripts/storage-monitor.js --continuous --interval=60
```

## Storage Optimization Features

The pipeline includes several storage optimization techniques:

- **Country Code Compression**: "United States" → "US"
- **Packaging Abbreviations**: "bottle" → "btl", "package" → "pkg"
- **Array Limits**: Maximum 5 items per array field
- **Text Truncation**: packaging_text limited to 200 characters
- **Quality Filtering**: Only enriches products with 2+ meaningful fields
- **Null Handling**: Only stores fields with actual data

## Expected Results

Based on analysis of Open Food Facts data:

- **~85% of products** will gain quantity information
- **~70% of products** will get packaging details
- **~60% of products** will receive origin/manufacturing data
- **~50% of products** will get store availability information
- **~45% of products** will receive certification labels

**Storage Impact**: ~200-300 bytes per enriched product (~300MB total for 1.5M products)

## Safety Features

- **Storage Monitoring**: Real-time tracking of MongoDB usage
- **Batch Processing**: Processes products in batches of 1,000
- **Sample Testing**: Tests on 100 products before full enrichment
- **Data Preservation**: Never overwrites existing quality data
- **Rollback Capability**: Can halt if storage limits approached
- **Quality Validation**: Validates data consistency and format

## Output Files

The pipeline generates several data files in `data/enrichment/`:

- `existing_barcodes.json` - Exported product barcodes with enrichment needs
- `field_analysis_results.json` - Analysis of field availability in Open Food Facts
- `enrichment_data.json` - Optimized enrichment data ready for import
- `sample_enrichment_test_results.json` - Sample test results and projections

## Troubleshooting

### Common Issues

1. **"DuckDB not found"**
   ```bash
   # Install DuckDB
   brew install duckdb  # macOS
   # or download from https://duckdb.org/
   ```

2. **"Open Food Facts file not found"**
   - Download `openfoodfacts-products.jsonl (1).gz` to `~/Desktop/`
   - File should be ~7GB compressed

3. **"Storage limit exceeded"**
   - Check current database size with storage monitor
   - Consider reducing enrichment scope
   - Increase MongoDB storage limit if possible

4. **"MongoDB connection failed"**
   - Verify `MONGODB_URI` environment variable
   - Check network connectivity
   - Ensure MongoDB credentials are correct

### Performance Tips

- Run during off-peak hours for production databases
- Monitor system resources during enrichment
- Use continuous storage monitoring during large enrichments
- Consider running sample test multiple times with different data subsets

## API Integration

After enrichment, the new fields will be available in your product API responses:

```javascript
// Example enriched product response
{
  "id": "...",
  "product_name": "Organic Milk",
  "quantity": "1L",
  "product_quantity": 1,
  "product_quantity_unit": "L",
  "packaging": "btl",
  "origins": ["FR", "DE"],
  "labels": ["org", "fair"],
  "stores": ["wmt", "tgt"],
  "countries": ["US", "CA"],
  "last_enriched": "2025-10-17T20:00:00.000Z"
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review individual script logs for detailed error information
3. Use storage monitor to check database status
4. Verify prerequisites are met

## Version History

- **v1.0** - Initial release with 11-field enrichment and storage optimization
