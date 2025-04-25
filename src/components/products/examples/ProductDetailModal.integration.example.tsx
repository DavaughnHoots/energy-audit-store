import React, { useEffect, useState, useMemo } from 'react';
import { getEstimator } from '../../../services/productEstimation/estimatorFactory';
import { EstimateResult } from '../../../services/productEstimation/types';
import { validateConfig, ProductEstimationsConfig } from '../../../schemas/productEstimationSchema';

/**
 * Product interface with properly typed fields
 */
interface Product {
  id: string;
  title: string;
  description?: string;
  type?: string;
  keyFeatures?: string[];
  // Add other fields as needed
}

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

/**
 * Product detail modal component that includes estimation results
 */
const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  // State for estimates
  const [estimateResult, setEstimateResult] = useState<EstimateResult | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  
  // State for explanation panel visibility
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  
  // Config state with memoized loading
  const [config, setConfig] = useState<ProductEstimationsConfig | null>(null);
  
  // Load configuration on mount (only once)
  useEffect(() => {
    async function loadConfig() {
      try {
        const configResponse = await fetch('/data/product-estimations.json');
        const configData = await configResponse.json();
        const validConfig = validateConfig(configData);
        setConfig(validConfig);
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    }
    
    loadConfig();
  }, []);
  
  // Load estimates when product details and config are available
  useEffect(() => {
    if (product && config) {
      loadEstimates(product, config);
    }
  }, [product, config]);
  
  // Load estimates function
  const loadEstimates = async (product: Product, config: ProductEstimationsConfig) => {
    setEstimateLoading(true);
    setEstimateError(null);
    
    try {
      // Determine product category
      const category = determineProductCategory(product);
      
      // Get the appropriate estimator
      const estimator = getEstimator(category, config);
      
      // Extract product attributes for estimation
      const productAttributes = extractProductAttributes(product, category);
      
      // Get estimation results
      const result = estimator.estimate(productAttributes);
      setEstimateResult(result);
    } catch (error) {
      console.error('Error loading estimates:', error);
      setEstimateError('Failed to load estimates. Please try again later.');
    } finally {
      setEstimateLoading(false);
    }
  };
  
  // Helper function to determine product category based on product data
  const determineProductCategory = (product: Product): 'dehumidifier' => {
    // Example logic - you would adapt this to your product data structure
    if (product.type === 'dehumidifier' || product.description?.toLowerCase().includes('dehumidifier')) {
      return 'dehumidifier';
    }
    
    // Add other category detection logic
    
    // Default fallback
    return 'dehumidifier';
  };
  
  // Helper function to extract relevant product attributes for estimation
  const extractProductAttributes = (product: Product, category: 'dehumidifier') => {
    // Example for dehumidifiers
    if (category === 'dehumidifier') {
      // Parse capacity from description or attributes
      const capacityMatch = product.description?.match(/Capacity.+?(\d+\.?\d*)\s*pints/i);
      const capacityPintsPerDay = capacityMatch ? parseFloat(capacityMatch[1]) : undefined;
      
      // Determine if ENERGY STAR certified from attributes
      const isEnergyStar = (
        product.keyFeatures?.some(f => f.toLowerCase().includes('energy star')) ||
        product.description?.toLowerCase().includes('energy star certified')
      );
      
      // Determine if Most Efficient
      const isMostEfficient = (
        product.keyFeatures?.some(f => f.toLowerCase().includes('most efficient')) ||
        product.description?.toLowerCase().includes('most efficient')
      );
      
      return {
        capacityPintsPerDay,
        isEnergyStar,
        isMostEfficient
      };
    }
    
    // Add extractors for other product categories
    
    return {};
  };
  
  // Example of how to render the estimation results in the UI
  const renderEstimates = () => {
    if (estimateLoading) {
      return <div className="loading-spinner" aria-live="polite">Loading estimates...</div>;
    }
    
    if (estimateError) {
      return <div className="error-message" aria-live="assertive">{estimateError}</div>;
    }
    
    if (!estimateResult) {
      return null;
    }
    
    return (
      <div className="estimates-container">
        <div className="price-section">
          <h3>{estimateResult.formattedPrice}</h3>
        </div>
        
        <div className="savings-section">
          <div className="estimate-row">
            <span className="label">Annual Savings:</span>
            <span className="value">{estimateResult.formattedAnnualSavings}</span>
          </div>
          
          <div className="estimate-row">
            <span className="label">ROI:</span>
            <span className="value">{estimateResult.formattedRoi}</span>
            {renderConfidenceMeter(estimateResult.confidenceLevel)}
          </div>
          
          <div className="estimate-row">
            <span className="label">Payback Period:</span>
            <span className="value">{estimateResult.formattedPaybackPeriod}</span>
          </div>
          
          <div className="estimate-row">
            <span className="label">Energy Efficiency:</span>
            <span className="value">{estimateResult.energyEfficiency}</span>
          </div>
        </div>
        
        {renderCalculationExplanation()}
      </div>
    );
  };
  
  // Render a confidence meter to indicate estimate reliability
  const renderConfidenceMeter = (confidenceLevel: 'low' | 'medium' | 'high') => {
    let colorClass;
    let valueText;
    let valuePercent;
    
    switch (confidenceLevel) {
      case 'high':
        colorClass = 'confidence-high';
        valueText = 'High confidence';
        valuePercent = 90;
        break;
      case 'medium':
        colorClass = 'confidence-medium';
        valueText = 'Medium confidence';
        valuePercent = 50;
        break;
      default:
        colorClass = 'confidence-low';
        valueText = 'Low confidence';
        valuePercent = 20;
    }
    
    return (
      <div 
        className={`confidence-meter ${colorClass}`}
        role="progressbar"
        aria-valuetext={valueText}
        aria-valuenow={valuePercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="confidence-bar" style={{ width: `${valuePercent}%` }}></div>
      </div>
    );
  };
  
  // Render explanation for how values were calculated
  const renderCalculationExplanation = () => {
    const explanationId = 'explanation-details';
    
    return (
      <div className="calculation-explanation">
        <button 
          className="explanation-toggle" 
          onClick={() => setIsExplanationVisible(!isExplanationVisible)}
          aria-expanded={isExplanationVisible}
          aria-controls={explanationId}
        >
          How we calculated this
        </button>
        
        <div 
          id={explanationId} 
          className={`explanation-details ${isExplanationVisible ? 'visible' : ''}`}
        >
          <h4>Calculation Methodology</h4>
          <p>
            These estimates are based on the product's specifications and average usage patterns:
          </p>
          <ul>
            <li><strong>Price:</strong> Base price + capacity adjustments + efficiency premium</li>
            <li><strong>Annual Savings:</strong> (Standard kWh - Efficient kWh) × Electricity rate</li>
            <li><strong>ROI:</strong> (Annual Savings ÷ Price) × 100%</li>
            <li><strong>Payback Period:</strong> Price ÷ Annual Savings</li>
          </ul>
          <p>
            Calculations use your region's average electricity rate of $0.14/kWh.
            Energy consumption is calculated using the product's Integrated Energy Factor (IEF).
          </p>
        </div>
      </div>
    );
  };
  
  // Rest of your modal code...
  return (
    <div className="product-detail-modal" role="dialog" aria-modal="true" aria-labelledby="product-title">
      <button className="close-button" onClick={onClose} aria-label="Close">×</button>
      
      <div className="modal-content">
        <h2 id="product-title">{product.title}</h2>
        
        {/* Render the estimates section */}
        {renderEstimates()}
        
        {/* Rest of your product details... */}
      </div>
    </div>
  );
};

export default ProductDetailModal;
