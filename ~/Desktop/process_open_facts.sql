-- Open Facts Data Processing Script
-- Filters to English-only products and removes heavy fields
-- Target: ~2.5GB total size for MongoDB

-- Create output directory
.shell mkdir -p processed_data

-- Process Open Food Facts (largest database)
COPY (
    SELECT 
        json_extract_string(json, 'code') as code,
        json_extract_string(json, 'product_name') as product_name,
        json_extract_string(json, 'brands') as brands,
        json_extract_string(json, 'categories') as categories,
        json_extract_string(json, 'categories_hierarchy') as categories_hierarchy,
        json_extract_string(json, 'ingredients_text') as ingredients_text,
        json_extract_string(json, 'labels') as labels,
        'food' as product_type,
        'openfoodfacts' as source_database
    FROM read_ndjson('openfoodfacts-products.jsonl (1).gz', ignore_errors=True)
    WHERE json_extract_string(json, 'lang') = 'en'
        AND json_extract_string(json, 'product_name') IS NOT NULL
        AND json_extract_string(json, 'product_name') != ''
        AND json_extract_string(json, 'code') IS NOT NULL
) TO 'processed_data/food_products_en.jsonl' (FORMAT JSON, ARRAY false);

-- Process Open Beauty Facts
COPY (
    SELECT 
        json_extract_string(json, 'code') as code,
        json_extract_string(json, 'product_name') as product_name,
        json_extract_string(json, 'brands') as brands,
        json_extract_string(json, 'categories') as categories,
        json_extract_string(json, 'categories_hierarchy') as categories_hierarchy,
        json_extract_string(json, 'ingredients_text') as ingredients_text,
        json_extract_string(json, 'labels') as labels,
        'beauty' as product_type,
        'openbeautyfacts' as source_database
    FROM read_ndjson('openbeautyfacts-products.jsonl.gz', ignore_errors=True)
    WHERE json_extract_string(json, 'lang') = 'en'
        AND json_extract_string(json, 'product_name') IS NOT NULL
        AND json_extract_string(json, 'product_name') != ''
        AND json_extract_string(json, 'code') IS NOT NULL
) TO 'processed_data/beauty_products_en.jsonl' (FORMAT JSON, ARRAY false);

-- Process Open Pet Food Facts
COPY (
    SELECT 
        code,
        product_name,
        brands,
        categories,
        categories_hierarchy,
        ingredients_text,
        labels,
        'petfood' as product_type,
        'openpetfoodfacts' as source_database
    FROM read_ndjson('openpetfoodfacts-products.jsonl.gz', ignore_errors=True)
    WHERE lang = 'en'
        AND product_name IS NOT NULL
        AND product_name != ''
        AND code IS NOT NULL
) TO 'processed_data/petfood_products_en.jsonl' (FORMAT JSON, ARRAY false);

-- Process Open Products Facts
COPY (
    SELECT 
        code,
        product_name,
        brands,
        categories,
        categories_hierarchy,
        ingredients_text,
        labels,
        'product' as product_type,
        'openproductsfacts' as source_database
    FROM read_ndjson('openproductsfacts-products.jsonl.gz', ignore_errors=True)
    WHERE lang = 'en'
        AND product_name IS NOT NULL
        AND product_name != ''
        AND code IS NOT NULL
) TO 'processed_data/products_en.jsonl' (FORMAT JSON, ARRAY false);

-- Show processing summary
SELECT 'Processing Summary' as info;

SELECT 
    'Food Products (English)' as database,
    count(*) as processed_count
FROM read_ndjson('processed_data/food_products_en.jsonl', ignore_errors=True);

SELECT 
    'Beauty Products (English)' as database,
    count(*) as processed_count
FROM read_ndjson('processed_data/beauty_products_en.jsonl', ignore_errors=True);

SELECT 
    'Pet Food Products (English)' as database,
    count(*) as processed_count
FROM read_ndjson('processed_data/petfood_products_en.jsonl', ignore_errors=True);

SELECT 
    'Products (English)' as database,
    count(*) as processed_count
FROM read_ndjson('processed_data/products_en.jsonl', ignore_errors=True);
