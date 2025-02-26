// backend/src/scripts/import_products_csv.ts
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { Pool } from 'pg';
import { query, getClient } from '../utils/dbUtils.js';

async function importProductsFromCSV() {
  try {
    console.log('Starting CSV import process...');
    
    // Path to the CSV file
    const csvFilePath = path.resolve(__dirname, '../../../public/data/products.csv');
    console.log('CSV file path:', csvFilePath);
    
    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    console.log('CSV data loaded, first 100 chars:', csvData.substring(0, 100));
    
    // Parse the CSV data
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        console.log('Processing header:', header);
        // Convert spaces and special characters to camelCase
        return header
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
      },
    });
    
    console.log('Papa Parse results:', {
      rows: results.data.length,
      errors: results.errors,
      meta: results.meta
    });
    
    if (results.errors && results.errors.length > 0) {
      console.error('Papa Parse errors:', results.errors);
      throw new Error('CSV parsing errors occurred');
    }
    
    // Get a client from the pool
    const client = await getClient();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Process each row and insert into the database
      for (const row of results.data as any[]) {
        try {
          // Parse features string into array
          const features = row.features
            ? row.features.split('\n').filter(Boolean).map((f: string) => f.trim())
            : [];
          
          // Extract specifications from description
          const specifications: { [key: string]: string } = {};
          if (row.description) {
            row.description.split('\n').forEach((line: string) => {
              const [key, value] = line.split(':').map(s => s.trim());
              if (key && value) {
                specifications[key] = value;
              }
            });
          }
          
          // Create product object
          const product = {
            id: row.energyStarUniqueId || String(results.data.indexOf(row) + 1),
            name: row.productName || 'Unknown Product',
            brand: row.brand || null,
            model: row.model || '',
            description: row.description || '',
            main_category: row.mainCategory || 'Uncategorized',
            sub_category: row.subCategory || 'General',
            efficiency: row.efficiency || '',
            product_url: row.productUrl || '',
            energy_star_id: row.energyStarUniqueId || '',
            upc_codes: row.upcCodes || '',
            additional_models: row.additionalModelNamesAndOrNumbers || '',
            pdf_url: row.pdfFileUrl || '',
            specifications: JSON.stringify(specifications),
            features: JSON.stringify(features)
          };
          
          // Insert product into database
          const insertQuery = `
            INSERT INTO products (
              id, name, brand, model, description, main_category, sub_category, 
              efficiency, product_url, energy_star_id, upc_codes, 
              additional_models, pdf_url, specifications, features
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            ) ON CONFLICT (id) DO UPDATE SET
              name = $2,
              brand = $3,
              model = $4,
              description = $5,
              main_category = $6,
              sub_category = $7,
              efficiency = $8,
              product_url = $9,
              energy_star_id = $10,
              upc_codes = $11,
              additional_models = $12,
              pdf_url = $13,
              specifications = $14,
              features = $15
          `;
          
          const values = [
            product.id,
            product.name,
            product.brand,
            product.model,
            product.description,
            product.main_category,
            product.sub_category,
            product.efficiency,
            product.product_url,
            product.energy_star_id,
            product.upc_codes,
            product.additional_models,
            product.pdf_url,
            product.specifications,
            product.features
          ];
          
          await client.query(insertQuery, values);
        } catch (err) {
          console.error(`Error processing row:`, row, err);
          throw err;
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log(`Successfully imported ${results.data.length} products into the database`);
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      // Release client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  } finally {
    // No need to close the pool as it's managed by dbUtils
  }
}

// Run the import function
importProductsFromCSV()
  .then(() => {
    console.log('CSV import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('CSV import failed:', error);
    process.exit(1);
  });
