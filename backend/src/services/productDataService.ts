// src/services/productDataService.ts
import Papa from 'papaparse';
import { Product, ProductFilters } from '../types/product.js';

class ProductDataService {
  private products: Product[] = [];

  async loadProductsFromCSV(file: string) {
    try {
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

      console.log('Successfully loaded products:', this.products.length);
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

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
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
    return this.products.find(p => p.id === id) || null;
  }

  async getCategories(): Promise<{ main: string[]; sub: { [key: string]: string[] } }> {
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