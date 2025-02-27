const { Pool } = require('pg');
const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importProducts() {
  try {
    // Path to your CSV file - using the path you provided
    let csvFilePath = path.join(process.cwd(), 'public', 'data', 'products_full.csv');
    console.log(`Looking for CSV file at: ${csvFilePath}`);
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found at ${csvFilePath}`);
      console.log('Searching for CSV file in other locations...');
      
      // Try alternative locations
      const possibleLocations = [
        path.join(process.cwd(), 'public', 'data', 'products.csv'),
        './public/data/products_full.csv',
        './public/data/products.csv'
      ];
      
      for (const location of possibleLocations) {
        if (fs.existsSync(location)) {
          console.log(`Found CSV file at: ${location}`);
          csvFilePath = location;
          break;
        }
      }
      
      if (!fs.existsSync(csvFilePath)) {
        throw new Error('Could not find CSV file');
      }
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
      // Map CSV columns to database columns
      const product = {
        main_category: row['Main Category'] || null,
        sub_category: row['Sub-Category'] || null,
        most_efficient: row['Most_Efficient'] === 'Yes',
        product_number: row['#'] || null,
        product_url: row['Product URL'] || null,
        product_name: row['Product Name'] || null,
        model: row['Model'] || null,
        description: row['Description'] || null,
        efficiency: row['Efficiency'] || null,
        features: row['Features'] || null,
        size: row['Size'] || null,
        lighting: row['Lighting'] || null,
        market: row['Market'] || null,
        additional_model_identification: row['Additional Model Identification'] || null,
        energy_star_id: row['ENERGY STAR Unique ID'] || null,
        upc_codes: row['UPC Codes'] || null,
        additional_models: row['Additional Model Names and/or Numbers'] || null,
        pdf_url: row['PDF File URL'] || null
      };
      
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
