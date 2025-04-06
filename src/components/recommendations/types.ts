import { AuditRecommendation, RecommendationPriority, RecommendationStatus } from '../../types/energyAudit';
import { Product, ProductRecommendationMatch } from '../../services/productRecommendationService';

/**
 * Display mode for the recommendations component
 * - compact: For Dashboard (limited info, no product cards)
 * - detailed: For Reports (full info with product cards)
 * - interactive: For Reports with edit controls
 */
export type RecommendationDisplayMode = 'compact' | 'detailed' | 'interactive';

/**
 * Data source type for recommendations
 */
export type RecommendationDataSource = 'detailed' | 'generated' | 'empty';

/**
 * Props for tracking edits to recommendations
 */
export interface RecommendationEdit {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

/**
 * Props for the unified recommendations component
 */
export interface UnifiedRecommendationsProps {
  // Core data
  recommendations: AuditRecommendation[];
  userCategories?: string[];
  budgetConstraint?: number;
  
  // Display configuration
  displayMode: RecommendationDisplayMode;
  maxRecommendations?: number;
  showProductSuggestions?: boolean;
  
  // Interactive functionality
  auditId?: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  
  // Edit functionality (for interactive mode)
  onUpdateStatus?: (id: string, status: RecommendationStatus, actualSavings?: number) => Promise<void>;
  onUpdatePriority?: (id: string, priority: RecommendationPriority) => Promise<void>;
  onUpdateImplementationDetails?: (id: string, date: string, cost: number) => Promise<void>;
  
  // Data source metadata
  isDefaultData?: boolean;
  dataSource?: RecommendationDataSource;
}

/**
 * Props for individual recommendation card
 */
export interface RecommendationCardProps {
  recommendation: AuditRecommendation;
  displayMode: RecommendationDisplayMode;
  productSuggestions?: ProductRecommendationMatch[];
  budgetConstraint?: number;
  
  // UI state tracking
  isEditingSavings?: boolean;
  isEditingPriority?: boolean;
  isEditingImplementation?: boolean;
  
  // Loading and error states
  isLoading?: boolean;
  errorMessage?: string;
  successMessage?: string;
  
  // Edit history
  editHistory?: Record<string, RecommendationEdit[]>;
  
  // Interactive functionality
  onUpdateStatus?: (id: string, status: RecommendationStatus, actualSavings?: number) => Promise<void>;
  onUpdatePriority?: (id: string, priority: RecommendationPriority) => Promise<void>;
  onUpdateImplementationDetails?: (id: string, date: string, cost: number) => Promise<void>;
  
  // Edit state handlers
  onStartEditingSavings?: (id: string) => void;
  onStartEditingPriority?: (id: string) => void;
  onStartEditingImplementation?: (id: string) => void;
  onCancelEditing?: () => void;
}

/**
 * Props for the recommendation filters component
 */
export interface RecommendationFiltersProps {
  userCategories: string[];
  showAllRecommendations: boolean;
  onToggleShowAll: () => void;
  dataSource?: RecommendationDataSource;
  totalRecommendations: number;
  filteredCount: number;
}

/**
 * Props for the product suggestion card
 */
export interface ProductSuggestionCardProps {
  product: Product;
  budgetConstraint?: number;
}

/**
 * Props for editable status field
 */
export interface StatusFieldProps {
  recommendation: AuditRecommendation;
  isLoading: boolean;
  onUpdate: (status: RecommendationStatus, actualSavings?: number) => Promise<void>;
  onCancel: () => void;
}

/**
 * Props for editable priority field
 */
export interface PriorityFieldProps {
  recommendation: AuditRecommendation;
  isLoading: boolean;
  onUpdate: (priority: RecommendationPriority) => Promise<void>;
  onCancel: () => void;
}

/**
 * Props for editable implementation details
 */
export interface ImplementationDetailsProps {
  recommendation: AuditRecommendation;
  isLoading: boolean;
  onUpdate: (date: string, cost: number) => Promise<void>;
  onCancel: () => void;
}
