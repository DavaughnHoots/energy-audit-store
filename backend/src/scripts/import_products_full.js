import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importProducts() {
  try {
    // Try multiple possible locations for the CSV file
    const possibleLocations = [
      path.join(process.cwd(), 'public', 'data', 'products_full.csv'),
      path.join(process.cwd(), 'public', 'data', 'products.csv'),
      path.join('/app', 'public', 'data', 'products_full.csv'),
      path.join('/app', 'public', 'data', 'products.csv'),
      './public/data/products_full.csv',
      './public/data/products.csv',
      '../public/data/products_full.csv',
      '../public/data/products.csv'
    ];
    
    let csvFilePath = null;
    
    for (const location of possibleLocations) {
      console.log(`Checking for CSV file at: ${location}`);
      if (fs.existsSync(location)) {
        console.log(`Found CSV file at: ${location}`);
        csvFilePath = location;
        break;
      }
    }
    
    if (!csvFilePath) {
      console.error('Could not find CSV file in any of the expected locations');
      console.log('Current working directory:', process.cwd());
      console.log('Directory contents:', fs.readdirSync(process.cwd()));
      
      // Try to list the contents of /app directory
      try {
        console.log('/app directory contents:', fs.readdirSync('/app'));
        console.log('/app/public directory contents:', fs.readdirSync('/app/public'));
        console.log('/app/public/data directory contents:', fs.readdirSync('/app/public/data'));
      } catch (err) {
        console.error('Error listing /app directory:', err.message);
      }
      
      throw new Error('Could not find CSV file');
    }
    
    console.log('Starting CSV import...');
    
    // Create a readable stream from the CSV file
    const parser = fs
      .createReadStream(csvFilePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    let count = 0;
    
    // Process each row
    for await (const row of parser) {
      // Function to truncate strings to fit in varchar(255)
      const truncate = (str, maxLength = 255) => {
        if (!str) return null;
        return str.length > maxLength ? str.substring(0, maxLength) : str;
      };
      
      // Map CSV columns to database columns with truncation
      const product = {
        main_category: truncate(row['Main Category']),
        sub_category: truncate(row['Sub-Category']),
        most_efficient: row['Most_Efficient'] === 'Yes',
        product_number: truncate(row['#']),
        product_url: truncate(row['Product URL']),
        product_name: truncate(row['Product Name']),
        model: truncate(row['Model']),
        description: truncate(row['Description']),
        efficiency: truncate(row['Efficiency']),
        features: truncate(row['Features']),
        size: truncate(row['Size']),
        lighting: truncate(row['Lighting']),
        market: truncate(row['Market']),
        additional_model_identification: truncate(row['Additional Model Identification']),
        energy_star_id: truncate(row['ENERGY STAR Unique ID']),
        upc_codes: truncate(row['UPC Codes']),
        additional_models: truncate(row['Additional Model Names and/or Numbers']),
        pdf_url: truncate(row['PDF File URL'])
      };
      
      try {
        // Check if product already exists to prevent duplicates
        const existingProduct = await pool.query(
          `SELECT id FROM products WHERE model = $1 AND product_name = $2 LIMIT 1`,
          [product.model, product.product_name]
        );
        
        if (existingProduct.rows.length > 0) {
          // Product already exists, skip
          console.log(`Skipping duplicate product: ${product.product_name} (${product.model})`);
          continue;
        }
        
        // Insert into database
        await pool.query(`
          INSERT INTO products (
            main_category, sub_category, most_efficient, product_number, 
            product_url, product_name, model, description, 
            efficiency, features, size, lighting, 
            market, additional_model_identification, energy_star_id, 
            upc_codes, additional_models, pdf_url
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
            $11, $12, $13, $14, $15, $16, $17, $18
          )
        `, [
          product.main_category, product.sub_category, product.most_efficient, product.product_number,
          product.product_url, product.product_name, product.model, product.description,
          product.efficiency, product.features, product.size, product.lighting,
          product.market, product.additional_model_identification, product.energy_star_id,
          product.upc_codes, product.additional_models, product.pdf_url
        ]);
      } catch (err) {
        console.error(`Error inserting product ${product.product_name}:`, err.message);
        // Continue with next product instead of stopping the entire import
        continue;
      }
      
      count++;
      if (count % 100 === 0) {
        console.log(`Imported ${count} products...`);
      }
    }
    
    console.log(`Import completed. Total products imported: ${count}`);
  } catch (error) {
    console.error('Error importing products:', error);
  } finally {
    await pool.end();
  }
}

importProducts();
