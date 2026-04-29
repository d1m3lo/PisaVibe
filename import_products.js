const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Exactly matching the columns in Supabase
const validColumns = [
  'id',              'name',
  'brand',           'description',
  'longDescription', 'gender',
  'category',        'subCategory',
  'variants',        'rating',
  'reviewsCount',    'reviews',
  'status',          'tags',
  'quality',         'isImported',
  'showSizeChart',   'origin',
  'hasGift'
];

async function importProducts() {
  try {
    const data = fs.readFileSync('export_products_2026-04-28_21-09.txt', 'utf8');
    const products = JSON.parse(data);
    
    console.log(`Read ${products.length} products from file.`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      // Create a clean object with only valid columns
      const cleanProduct = {};
      for (const key of validColumns) {
        if (product[key] !== undefined) {
          cleanProduct[key] = product[key];
        }
      }

      // Default rating to 0 if missing
      if (cleanProduct.rating === undefined) {
          cleanProduct.rating = 0;
      }

      const { data: inserted, error } = await supabase
        .from('products')
        .upsert(cleanProduct)
        .select();

      if (error) {
        console.error(`\nError inserting product ${product.id} (${product.name}):`, error.message);
        errorCount++;
      } else {
        successCount++;
        process.stdout.write('.');
      }
    }

    console.log(`\nImport complete! Success: ${successCount}, Errors: ${errorCount}`);
  } catch (err) {
    console.error("\nFatal error:", err);
  }
}

importProducts();
