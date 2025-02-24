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
   * Search products with filters and pagination
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
      // Build the base query
      let queryString = `
        SELECT *,
          ts_rank_cd(to_tsvector('english',
            name || ' ' || description || ' ' || 
            COALESCE(features::text, '') || ' ' || 
            COALESCE(specifications::text, '')
          ), plainto_tsquery('english', $1)) as relevance
        FROM products
        WHERE 1=1
      `;

      const queryParams: any[] = [query];
      let paramCount = 2;

      // Add filters
      const { whereClause, filterParams } = this.buildFilterClause(filters, paramCount);
      queryString += whereClause;
      queryParams.push(...filterParams);
      paramCount += filterParams.length;

      // Add full-text search condition if query is not empty
      if (query.trim()) {
        queryString += `
          AND to_tsvector('english',
            name || ' ' || description || ' ' || 
            COALESCE(features::text, '') || ' ' || 
            COALESCE(specifications::text, '')
          ) @@ plainto_tsquery('english', $1)
        `;
      }

      // Add sorting
      queryString += this.buildSortClause(sortBy, sortOrder);

      // Add pagination
      queryString += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit, offset);

      // Execute search query
      const [results, countResult] = await Promise.all([
        this.pool.query(queryString, queryParams),
        this.pool.query(
          `SELECT COUNT(*) FROM (${queryString.split('LIMIT')[0]}) as count_query`,
          queryParams.slice(0, -2)
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
      clauses.push(`category = $${paramCount}`);
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
        return ` ORDER BY relevance ${sortOrder}, name ASC`;
      default:
        return ` ORDER BY name ASC`;
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
