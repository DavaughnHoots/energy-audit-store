import { ProductReference } from '../../../types/energyAudit.js';
import { Product } from '../../../types/product.js';

/**
 * Adapter to normalize product references to match Product type used by formatter
 */
export const normalizeProductForDisplay = (product: ProductReference): Product => {
  // Create a base product structure with default values
  const normalizedProduct: Product = {
    id: product.id,
    name: product.name,
    description: product.description || 'No description available',
    specifications: product.specifications || {},
    marketInfo: product.marketInfo || '',
    energyStarId: product.energyStarId || '',
    productUrl: product.productUrl || '',
    mainCategory: product.mainCategory || 'Other',
    subCategory: product.subCategory || 'general',
    model: product.model || '',
    features: product.features || [],
    // Efficiency must be a string for the Product interface
    efficiency: ''
  };
  
  // Copy additional properties if they exist
  if (product.brand) normalizedProduct.brand = product.brand;
  if (product.category) normalizedProduct.category = product.category;
  if (product.price) normalizedProduct.price = product.price;
  if (product.imageUrl) normalizedProduct.imageUrl = product.imageUrl;
  if (product.rebateAmount) normalizedProduct.rebateAmount = product.rebateAmount;
  
  // Handle efficiency data - convert the object to a string format
  if (product.efficiency) {
    normalizedProduct.efficiency = `${product.efficiency.rating || ''} ${product.efficiency.value}${product.efficiency.unit || ''}`.trim();
  }
  
  return normalizedProduct;
};
