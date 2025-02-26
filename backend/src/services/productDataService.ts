// src/services/productDataService.ts
import { Product, ProductFilters } from '../types/product.js';
import { query } from '../utils/dbUtils.js';

class ProductDataService {
  private initialized = false;

  async loadProductsFromCSV(file: string) {
    try {
      console.log('Checking database connection...');
      
      // Check if we can connect to the database
      const testResult = await query('SELECT NOW()');
      console.log('Database connection successful:', testResult.rows[0]);
      
      // Check if products table has data
      const countResult = await query('SELECT COUNT(*) as count FROM products');
      const productCount = parseInt((countResult.rows[0] as any).count);
      
      console.log(`Found ${productCount} products in database`);
      
      if (productCount === 0) {
        console.warn('No products found in database. You may need to run the import script.');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      const err = error as Error;
      console.error('Database connection error:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      throw new Error(`Failed to connect to database: ${err.message}`);
    }
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      if (!this.initialized) {
        await this.loadProductsFromCSV('');
      }
      
      let queryText = `
        SELECT 
          id, name, brand, model, description, main_category, sub_category, 
          efficiency, product_url, energy_star_id, upc_codes, 
          additional_models, pdf_url, specifications, features
        FROM products
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      
      if (filters) {
        if (filters.mainCategory) {
          queryParams.push(filters.mainCategory.toLowerCase());
          queryText += ` AND LOWER(main_category) = LOWER($${queryParams.length})`;
        }
        
        if (filters.subCategory) {
          queryParams.push(filters.subCategory.toLowerCase());
          queryText += ` AND LOWER(sub_category) = LOWER($${queryParams.length})`;
        }
        
        if (filters.search) {
          queryParams.push(`%${filters.search.toLowerCase()}%`);
          queryText += ` AND (
            LOWER(name) LIKE $${queryParams.length} OR
            LOWER(description) LIKE $${queryParams.length} OR
            LOWER(model) LIKE $${queryParams.length}
          )`;
        }
      }
      
      queryText += ' ORDER BY name';
      
      const result = await query(queryText, queryParams);
      
      return result.rows.map((row: any) => {
        return {
          id: row.id,
          name: row.name,
          brand: row.brand,
          model: row.model,
          description: row.description,
          mainCategory: row.main_category,
          subCategory: row.sub_category,
          efficiency: row.efficiency,
          productUrl: row.product_url,
          energyStarId: row.energy_star_id,
          upcCodes: row.upc_codes,
          additionalModels: row.additional_models,
          pdfUrl: row.pdf_url,
          specifications: typeof row.specifications === 'string' 
            ? JSON.parse(row.specifications) 
            : row.specifications,
          features: typeof row.features === 'string' 
            ? JSON.parse(row.features) 
            : row.features,
          marketInfo: row.market_info || ''
        };
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      if (!this.initialized) {
        await this.loadProductsFromCSV('');
      }
      
      const result = await query(
        `SELECT 
          id, name, brand, model, description, main_category, sub_category, 
          efficiency, product_url, energy_star_id, upc_codes, 
          additional_models, pdf_url, specifications, features
        FROM products
        WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row: any = result.rows[0];
      
      return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        model: row.model,
        description: row.description,
        mainCategory: row.main_category,
        subCategory: row.sub_category,
        efficiency: row.efficiency,
        productUrl: row.product_url,
        energyStarId: row.energy_star_id,
        upcCodes: row.upc_codes,
        additionalModels: row.additional_models,
        pdfUrl: row.pdf_url,
        specifications: typeof row.specifications === 'string' 
          ? JSON.parse(row.specifications) 
          : row.specifications,
        features: typeof row.features === 'string' 
          ? JSON.parse(row.features) 
          : row.features,
        marketInfo: row.market_info || ''
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  async getCategories(): Promise<{ main: string[]; sub: { [key: string]: string[] } }> {
    try {
      if (!this.initialized) {
        await this.loadProductsFromCSV('');
      }
      
      // Get all distinct main categories
      const mainCategoriesResult = await query(
        'SELECT DISTINCT main_category FROM products ORDER BY main_category'
      );
      
      const categories = {
        main: mainCategoriesResult.rows.map((row: any) => row.main_category),
        sub: {} as { [key: string]: string[] }
      };
      
      // For each main category, get its subcategories
      for (const mainCategory of categories.main) {
        const subCategoriesResult = await query(
          'SELECT DISTINCT sub_category FROM products WHERE main_category = $1 ORDER BY sub_category',
          [mainCategory]
        );
        
        categories.sub[mainCategory] = subCategoriesResult.rows.map((row: any) => row.sub_category);
      }
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}

export default ProductDataService;
