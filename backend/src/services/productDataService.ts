// src/services/productDataService.ts
import Papa from 'papaparse';
import { Product, ProductFilters } from '../types/product.js';
import pool from '../config/database.js';

class ProductDataService {
  private products: Product[] = [];
  private useDatabase = true;

  constructor() {
    // Check if we should use the database or fallback to CSV
    this.loadFromDatabase()
      .then(success => {
        if (!success) {
          console.log('Database load failed, will use CSV fallback');
          this.useDatabase = false;
        }
      })
      .catch(err => {
        console.error('Error checking database:', err);
        this.useDatabase = false;
      });
  }

  private async loadFromDatabase(): Promise<boolean> {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM products');
      const count = parseInt(result.rows[0].count);
      console.log(`Database has ${count} products`);
      return count > 0;
    } catch (err) {
      console.error('Database error:', err);
      return false;
    }
  }

  async loadProductsFromCSV(file: string) {
    try {
      // If we have products in the database, use those instead
      if (this.useDatabase) {
        const dbProducts = await this.loadProductsFromDatabase();
        if (dbProducts.length > 0) {
          this.products = dbProducts;
          console.log('Successfully loaded products from database:', this.products.length);
          return true;
        }
      }

      console.log('Attempting to load file:', file);

      // Use fetch instead of fs
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvData = await response.text();
      console.log('CSV data loaded, first 100 chars:', csvData.substring(0, 100));

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

      this.products = results.data.map((row: any, index) => {
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

          return {
            id: row.energyStarUniqueId || String(index + 1),
            productUrl: row.productUrl || '',
            mainCategory: row.mainCategory || 'Uncategorized',
            subCategory: row.subCategory || 'General',
            name: row.productName || 'Unknown Product',
            model: row.model || '',
            description: row.description || '',
            efficiency: row.efficiency || '',
            features: features,
            marketInfo: row.market || '',
            energyStarId: row.energyStarUniqueId || '',
            upcCodes: row.upcCodes || '',
            additionalModels: row.additionalModelNamesAndOrNumbers || '',
            pdfUrl: row.pdfFileUrl || '',
            specifications
          };
        } catch (err) {
          console.error(`Error processing row ${index}:`, row, err);
          throw err;
        }
      });

      console.log('Successfully loaded products from CSV:', this.products.length);
      return true;
    } catch (error) {
      const err = error as Error;
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      throw new Error(`Failed to load products: ${err.message}`);
    }
  }

  private async loadProductsFromDatabase(): Promise<Product[]> {
    try {
      const result = await pool.query('SELECT * FROM products');
      
      return result.rows.map((row: any) => {
        // Parse features from string if needed
        const features = row.features 
          ? (typeof row.features === 'string' ? row.features.split('\n').filter(Boolean) : row.features)
          : [];

        // Extract specifications from description
        const specifications: { [key: string]: string } = {};
        if (row.description) {
          row.description.split('\n').forEach((line: string) => {
            const [key, value] = line.split(':').map((s: string) => s.trim());
            if (key && value) {
              specifications[key] = value;
            }
          });
        }

        return {
          id: row.id.toString(),
          productUrl: row.product_url || '',
          mainCategory: row.main_category || 'Uncategorized',
          subCategory: row.sub_category || 'General',
          name: row.product_name || 'Unknown Product',
          model: row.model || '',
          description: row.description || '',
          efficiency: row.efficiency || '',
          features: features,
          marketInfo: row.market || '',
          energyStarId: row.energy_star_id || '',
          upcCodes: row.upc_codes || '',
          additionalModels: row.additional_models || '',
          pdfUrl: row.pdf_url || '',
          specifications
        };
      });
    } catch (err) {
      console.error('Error loading products from database:', err);
      return [];
    }
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    // If we're using the database and products array is empty, load from DB
    if (this.useDatabase && this.products.length === 0) {
      this.products = await this.loadProductsFromDatabase();
    }

    // If still empty, try to load from CSV
    if (this.products.length === 0) {
      await this.loadProductsFromCSV('/data/products.csv');
    }

    let filteredProducts = [...this.products];

    if (filters) {
      if (filters.mainCategory) {
        filteredProducts = filteredProducts.filter(
          p => p.mainCategory.toLowerCase() === filters.mainCategory?.toLowerCase()
        );
      }

      if (filters.subCategory) {
        filteredProducts = filteredProducts.filter(
          p => p.subCategory.toLowerCase() === filters.subCategory?.toLowerCase()
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.model.toLowerCase().includes(searchLower)
        );
      }
    }

    return filteredProducts;
  }

  async getProduct(id: string): Promise<Product | null> {
    // If we're using the database and products array is empty, try to get directly from DB
    if (this.useDatabase && this.products.length === 0) {
      try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1 OR energy_star_id = $1', [id]);
        if (result.rows.length > 0) {
          const row = result.rows[0];
          
          // Parse features from string if needed
          const features = row.features 
            ? (typeof row.features === 'string' ? row.features.split('\n').filter(Boolean) : row.features)
            : [];

          // Extract specifications from description
          const specifications: { [key: string]: string } = {};
          if (row.description) {
            row.description.split('\n').forEach((line: string) => {
              const [key, value] = line.split(':').map((s: string) => s.trim());
              if (key && value) {
                specifications[key] = value;
              }
            });
          }

          return {
            id: row.id.toString(),
            productUrl: row.product_url || '',
            mainCategory: row.main_category || 'Uncategorized',
            subCategory: row.sub_category || 'General',
            name: row.product_name || 'Unknown Product',
            model: row.model || '',
            description: row.description || '',
            efficiency: row.efficiency || '',
            features: features,
            marketInfo: row.market || '',
            energyStarId: row.energy_star_id || '',
            upcCodes: row.upc_codes || '',
            additionalModels: row.additional_models || '',
            pdfUrl: row.pdf_url || '',
            specifications
          };
        }
      } catch (err) {
        console.error('Error getting product from database:', err);
      }
    }

    // If we couldn't get from DB or not using DB, check the products array
    if (this.products.length === 0) {
      await this.loadProductsFromCSV('/data/products.csv');
    }
    
    return this.products.find(p => p.id === id) || null;
  }

  async getCategories(): Promise<{ main: string[]; sub: { [key: string]: string[] } }> {
    // If we're using the database, try to get categories directly from DB
    if (this.useDatabase) {
      try {
        const result = await pool.query(`
          SELECT DISTINCT main_category, sub_category 
          FROM products 
          ORDER BY main_category, sub_category
        `);
        
        const categories = {
          main: [] as string[],
          sub: {} as { [key: string]: string[] }
        };

        result.rows.forEach((row: any) => {
          const mainCategory = row.main_category;
          const subCategory = row.sub_category;
          
          if (!categories.main.includes(mainCategory)) {
            categories.main.push(mainCategory);
            categories.sub[mainCategory] = [];
          }

          if (!categories.sub[mainCategory].includes(subCategory)) {
            categories.sub[mainCategory].push(subCategory);
          }
        });

        return categories;
      } catch (err) {
        console.error('Error getting categories from database:', err);
      }
    }

    // If we couldn't get from DB or not using DB, calculate from products array
    if (this.products.length === 0) {
      await this.loadProductsFromCSV('/data/products.csv');
    }

    const categories = {
      main: [] as string[],
      sub: {} as { [key: string]: string[] }
    };

    this.products.forEach(product => {
      if (!categories.main.includes(product.mainCategory)) {
        categories.main.push(product.mainCategory);
        categories.sub[product.mainCategory] = [];
      }

      if (!categories.sub[product.mainCategory]!.includes(product.subCategory)) {
        categories.sub[product.mainCategory]!.push(product.subCategory);
      }
    });

    return categories;
  }
}

export default ProductDataService;
