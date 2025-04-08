// Simple script to create products table and insert sample data on Heroku
const { Pool } = require('pg');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createProductsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        model VARCHAR(255),
        description TEXT,
        main_category VARCHAR(255),
        sub_category VARCHAR(255),
        efficiency VARCHAR(50),
        product_url TEXT,
        energy_star_id VARCHAR(255),
        upc_codes TEXT,
        additional_models TEXT,
        pdf_url TEXT,
        specifications JSONB,
        features JSONB,
        market_info VARCHAR(255)
      );
    `);
    console.log('Products table created or already exists');
  } catch (error) {
    console.error('Error creating products table:', error);
    throw error;
  }
}

async function importSampleProducts() {
  try {
    // Sample products
    const products = [
      {
        id: '1',
        name: 'Energy Efficient LED Bulb',
        brand: 'EcoLight',
        model: 'EL-100',
        description: 'Energy-efficient LED bulb with long lifespan',
        main_category: 'Lighting',
        sub_category: 'LED Bulbs',
        efficiency: 'A+',
        product_url: 'https://example.com/led-bulb',
        energy_star_id: 'ES-12345',
        specifications: JSON.stringify({ 'Wattage': '9W', 'Lumens': '800' }),
        features: JSON.stringify(['Energy Efficient', 'Long Lifespan']),
        market_info: 'Residential'
      },
      {
        id: '2',
        name: 'Smart Thermostat',
        brand: 'ClimateControl',
        model: 'CC-200',
        description: 'Smart thermostat with energy-saving features',
        main_category: 'HVAC',
        sub_category: 'Thermostats',
        efficiency: 'A++',
        product_url: 'https://example.com/smart-thermostat',
        energy_star_id: 'ES-67890',
        specifications: JSON.stringify({ 'Connectivity': 'Wi-Fi', 'Compatibility': 'Most HVAC systems' }),
        features: JSON.stringify(['Smart Scheduling', 'Remote Control']),
        market_info: 'Residential'
      },
      {
        id: '3',
        name: 'Energy Star Refrigerator',
        brand: 'CoolTech',
        model: 'CT-300',
        description: 'Energy-efficient refrigerator with advanced cooling',
        main_category: 'Appliances',
        sub_category: 'Refrigerators',
        efficiency: 'A+++',
        product_url: 'https://example.com/refrigerator',
        energy_star_id: 'ES-24680',
        specifications: JSON.stringify({ 'Capacity': '20 cu ft', 'Annual Energy Use': '300 kWh' }),
        features: JSON.stringify(['Frost-Free', 'LED Lighting']),
        market_info: 'Residential'
      }
    ];
    
    // Insert products
    for (const product of products) {
      await pool.query(`
        INSERT INTO products (
          id, name, brand, model, description, main_category, sub_category, 
          efficiency, product_url, energy_star_id, specifications, features, market_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          name = $2,
          brand = $3,
          model = $4,
          description = $5,
          main_category = $6,
          sub_category = $7,
          efficiency = $8,
          product_url = $9,
          energy_star_id = $10,
          specifications = $11,
          features = $12,
          market_info = $13
      `, [
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
        product.specifications,
        product.features,
        product.market_info
      ]);
    }
    
    console.log(`Successfully imported ${products.length} sample products`);
  } catch (error) {
    console.error('Error importing sample products:', error);
    throw error;
  }
}

async function main() {
  try {
    await createProductsTable();
    await importSampleProducts();
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

main();
