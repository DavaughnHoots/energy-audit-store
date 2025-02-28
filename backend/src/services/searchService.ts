// backend/src/services/searchService.ts

import { Pool } from 'pg';
import { Product } from '../types/product.js';

interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  efficiencyRating?: string;
  brands?: string[];
  features?: string[];
  hasRebate?: boolean;
}

interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export class SearchService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Search products with filters and pagination using optimized full-text search
   */
  async searchProducts(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult<Product>> {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    try {
      // Log the search request for debugging
      console.log('Search request:', { query, filters, options });
      
      // Build the base query using the optimized search_vector column
      let queryString = `
        SELECT *,
          ts_rank_cd(search_vector, plainto_tsquery('english', $1)) as relevance
        FROM products
        WHERE 1=1
      `;

      // Convert the search query to a tsquery format
      // Handle the search query more safely
      let tsQuery = '';
      try {
        // Clean and normalize the search query
        const cleanedQuery = query.trim()
          .replace(/[^\w\s]/gi, '') // Remove special characters
          .toLowerCase();
          
        if (cleanedQuery) {
          // Use a simpler approach with plainto_tsquery for better compatibility
          tsQuery = cleanedQuery;
        }
      } catch (error) {
        console.error('Error formatting search query:', error);
        // Fallback to a simple query if there's an error
        tsQuery = '';
      }

      // If the query is empty after processing, use a default that will match everything
      const finalTsQuery = tsQuery || '';
      console.log('Processed search query:', { original: query, processed: finalTsQuery });
      
      const queryParams: any[] = [finalTsQuery];
      let paramCount = 2;

      // Add filters
      const { whereClause, filterParams } = this.buildFilterClause(filters, paramCount);
      queryString += whereClause;
      queryParams.push(...filterParams);
      paramCount += filterParams.length;

      // Add full-text search condition
      // Use plainto_tsquery for safer query parsing
      if (finalTsQuery) {
        queryString += `
          AND (
            search_vector @@ plainto_tsquery('english', $1)
            OR product_name ILIKE '%' || $${paramCount} || '%'
            OR model ILIKE '%' || $${paramCount} || '%'
            OR description ILIKE '%' || $${paramCount} || '%'
          )
        `;
        queryParams.push(query.trim()); // Add the original query for ILIKE fallback
        paramCount++;
      }

      // Add sorting
      queryString += this.buildSortClause(sortBy, sortOrder);

      // Add pagination
      queryString += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit, offset);

      // Log the final query for debugging
      console.log('Search query:', { sql: queryString, params: queryParams });

      // Execute search query
      const results = await this.pool.query(queryString, queryParams);

      // Get total count for pagination - use a more efficient count query
      let countQuery = `
        SELECT COUNT(*) 
        FROM products 
        WHERE 1=1
      `;
      
      const countParams = [];
      
      // Add filters to count query
      if (Object.keys(filters).length > 0) {
        const { whereClause, filterParams } = this.buildFilterClause(filters, 1);
        countQuery += whereClause;
        countParams.push(...filterParams);
      }
      
      // Add search condition to count query
      if (finalTsQuery) {
        countQuery += ` 
          AND (
            search_vector @@ plainto_tsquery('english', $${countParams.length + 1})
            OR product_name ILIKE '%' || $${countParams.length + 2} || '%'
            OR model ILIKE '%' || $${countParams.length + 2} || '%'
            OR description ILIKE '%' || $${countParams.length + 2} || '%'
          )
        `;
        countParams.push(finalTsQuery, query.trim());
      }
      
      const countResult = await this.pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      // Map database rows to Product objects
      const products = results.rows.map(row => ({
        id: row.id.toString(),
        productUrl: row.product_url || '',
        mainCategory: row.main_category || 'Uncategorized',
        subCategory: row.sub_category || 'General',
        name: row.product_name || 'Unknown Product',
        model: row.model || '',
        description: row.description || '',
        efficiency: row.efficiency || '',
        features: typeof row.features === 'string' 
          ? row.features.split('\n').filter(Boolean) 
          : (row.features || []),
        marketInfo: row.market || '',
        energyStarId: row.energy_star_id || '',
        upcCodes: row.upc_codes || '',
        additionalModels: row.additional_models || '',
        pdfUrl: row.pdf_url || '',
        specifications: row.specifications || {}
      }));

      return {
        items: products,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error) {
        throw new SearchError(`Failed to search products: ${error.message}`);
      }
      throw new SearchError('Failed to search products: Unknown error');
    }
  }

  /**
   * Search recommendations
   */
  async searchRecommendations(
    userId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<any>> {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    try {
      const queryString = `
        SELECT r.*, 
          CASE WHEN r.implemented THEN 2
               WHEN r.priority = 'high' THEN 1
               ELSE 0
          END as relevance_score
        FROM recommendations r
        WHERE r.user_id = $1
        AND (
          r.description ILIKE $2
          OR r.category ILIKE $2
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(r.recommended_products) as p
            WHERE p->>'name' ILIKE $2
          )
        )
        ORDER BY 
          relevance_score DESC,
          ${this.getOrderByClause(sortBy, sortOrder)}
        LIMIT $3 OFFSET $4
      `;

      const [results, countResult] = await Promise.all([
        this.pool.query(queryString, [userId, `%${query}%`, limit, offset]),
        this.pool.query(
          `SELECT COUNT(*) FROM recommendations r
           WHERE r.user_id = $1
           AND (
             r.description ILIKE $2
             OR r.category ILIKE $2
             OR EXISTS (
               SELECT 1 FROM jsonb_array_elements(r.recommended_products) as p
               WHERE p->>'name' ILIKE $2
             )
           )`,
          [userId, `%${query}%`]
        )
      ]);

      const total = parseInt(countResult.rows[0].count);

      return {
        items: results.rows,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new SearchError(`Failed to search recommendations: ${error.message}`);
      }
      throw new SearchError('Failed to search recommendations: Unknown error');
    }
  }

  /**
   * Search energy audit reports
   */
  async searchAuditReports(
    userId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<any>> {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'completed_at',
      sortOrder = 'desc'
    } = options;

    try {
      const queryString = `
        SELECT ea.*,
          ts_rank_cd(to_tsvector('english',
            COALESCE(ea.home_details::text, '') || ' ' ||
            COALESCE(ea.current_conditions::text, '') || ' ' ||
            COALESCE(ea.heating_cooling::text, '')
          ), plainto_tsquery('english', $2)) as relevance
        FROM energy_audits ea
        WHERE ea.user_id = $1
        AND to_tsvector('english',
          COALESCE(ea.home_details::text, '') || ' ' ||
          COALESCE(ea.current_conditions::text, '') || ' ' ||
          COALESCE(ea.heating_cooling::text, '')
        ) @@ plainto_tsquery('english', $2)
        ORDER BY 
          ${this.getOrderByClause(sortBy, sortOrder)}
        LIMIT $3 OFFSET $4
      `;

      const [results, countResult] = await Promise.all([
        this.pool.query(queryString, [userId, query, limit, offset]),
        this.pool.query(
          `SELECT COUNT(*) FROM energy_audits ea
           WHERE ea.user_id = $1
           AND to_tsvector('english',
             COALESCE(ea.home_details::text, '') || ' ' ||
             COALESCE(ea.current_conditions::text, '') || ' ' ||
             COALESCE(ea.heating_cooling::text, '')
           ) @@ plainto_tsquery('english', $2)`,
          [userId, query]
        )
      ]);

      const total = parseInt(countResult.rows[0].count);

      return {
        items: results.rows,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new SearchError(`Failed to search audit reports: ${error.message}`);
      }
      throw new SearchError('Failed to search audit reports: Unknown error');
    }
  }

  // Private helper methods

  private buildFilterClause(filters: SearchFilters, startParamCount: number): {
    whereClause: string;
    filterParams: any[];
  } {
    const clauses: string[] = [];
    const params: any[] = [];
    let paramCount = startParamCount;

    if (filters.category) {
      clauses.push(`main_category = $${paramCount}`);
      params.push(filters.category);
      paramCount++;
    }

    if (filters.minPrice !== undefined) {
      clauses.push(`price >= $${paramCount}`);
      params.push(filters.minPrice);
      paramCount++;
    }

    if (filters.maxPrice !== undefined) {
      clauses.push(`price <= $${paramCount}`);
      params.push(filters.maxPrice);
      paramCount++;
    }

    if (filters.efficiencyRating) {
      clauses.push(`efficiency_rating = $${paramCount}`);
      params.push(filters.efficiencyRating);
      paramCount++;
    }

    if (filters.brands?.length) {
      clauses.push(`brand = ANY($${paramCount})`);
      params.push(filters.brands);
      paramCount++;
    }

    if (filters.features?.length) {
      clauses.push(`features ?| $${paramCount}`);
      params.push(filters.features);
      paramCount++;
    }

    if (filters.hasRebate !== undefined) {
      clauses.push(`rebate_amount ${filters.hasRebate ? '>' : '='} 0`);
    }

    return {
      whereClause: clauses.length ? ` AND ${clauses.join(' AND ')}` : '',
      filterParams: params
    };
  }

  private buildSortClause(sortBy: string, sortOrder: 'asc' | 'desc'): string {
    switch (sortBy) {
      case 'price':
        return ` ORDER BY price ${sortOrder}`;
      case 'efficiency':
        return ` ORDER BY efficiency_rating ${sortOrder}`;
      case 'relevance':
        return ` ORDER BY relevance ${sortOrder}, product_name ASC`;
      default:
        return ` ORDER BY product_name ASC`;
    }
  }

  private getOrderByClause(sortBy: string, sortOrder: 'asc' | 'desc'): string {
    const validColumns = ['created_at', 'completed_at', 'status', 'priority'];
    return validColumns.includes(sortBy) ? 
      `${sortBy} ${sortOrder}` : 
      'created_at DESC';
  }
}

export class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchError';
  }
}
