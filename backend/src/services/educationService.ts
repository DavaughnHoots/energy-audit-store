// backend/src/services/educationService.ts
import db from '../utils/db.js';
import { 
  EducationalResource, 
  ResourceCollection,
  ResourceFilters, 
  BookmarkRequest, 
  ProgressUpdateRequest, 
  RatingRequest,
  ResourceProgress,
  ResourceRating,
  ResourceBookmark
} from '../types/education.js';

/**
 * Education Resource Service
 * Handles CRUD operations for educational resources and user interactions
 */
class EducationService {
  /**
   * Get educational resources with optional filtering
   */
  async getResources(
    filters: ResourceFilters = {}, 
    userId?: number
  ): Promise<EducationalResource[]> {
    try {
      // Build the base query
      let query = `
        SELECT 
          er.*,
          COALESCE(AVG(rr.rating), 0) as average_rating,
          COUNT(DISTINCT rr.id) as rating_count,
          CASE WHEN rb.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked,
          rp.status as progress_status,
          rp.progress_percent
        FROM 
          educational_resources er
        LEFT JOIN 
          resource_ratings rr ON er.id = rr.resource_id
        LEFT JOIN 
          resource_bookmarks rb ON er.id = rb.resource_id AND rb.user_id = $1
        LEFT JOIN 
          resource_progress rp ON er.id = rp.resource_id AND rp.user_id = $1
      `;

      // Add WHERE clauses based on filters
      const conditions = [];
      const queryParams = [userId || null];
      let paramIndex = 2;

      if (filters.type) {
        conditions.push(`er.type = $${paramIndex++}`);
        queryParams.push(filters.type as string);
      }

      if (filters.topic) {
        conditions.push(`er.topic = $${paramIndex++}`);
        queryParams.push(filters.topic as string);
      }

      if (filters.level) {
        conditions.push(`er.level = $${paramIndex++}`);
        queryParams.push(filters.level as string);
      }

      if (filters.featured !== undefined) {
        conditions.push(`er.is_featured = $${paramIndex++}`);
        queryParams.push(filters.featured as boolean);
      }

      if (filters.search) {
        conditions.push(`(
          er.title ILIKE $${paramIndex} OR 
          er.description ILIKE $${paramIndex} OR
          EXISTS (SELECT 1 FROM unnest(er.tags) tag WHERE tag ILIKE $${paramIndex})
        )`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.tags && filters.tags.length > 0) {
        conditions.push(`er.tags @> $${paramIndex++}`);
        queryParams.push(filters.tags as string[]);
      }

      if (filters.collection_id) {
        conditions.push(`
          EXISTS (
            SELECT 1 FROM collection_resources cr 
            WHERE cr.resource_id = er.id AND cr.collection_id = $${paramIndex++}
          )
        `);
        queryParams.push(filters.collection_id);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add GROUP BY for aggregations
      query += ' GROUP BY er.id, rb.user_id, rp.status, rp.progress_percent';

      // Add ORDER BY based on sort preference
      if (filters.sort_by) {
        switch (filters.sort_by) {
          case 'newest':
            query += ' ORDER BY er.date_published DESC';
            break;
          case 'popular':
            query += ' ORDER BY er.popularity DESC';
            break;
          case 'rating':
            query += ' ORDER BY average_rating DESC, rating_count DESC';
            break;
          default:
            query += ' ORDER BY er.date_published DESC';
        }
      } else {
        query += ' ORDER BY er.date_published DESC';
      }

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        queryParams.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex++}`;
        queryParams.push(filters.offset);
      }

      // Execute the query
      const result = await db.query(query, queryParams);
      
      return result.rows.map(row => {
        // Transform database row to EducationalResource object
        const resource: EducationalResource = {
          id: row.id,
          title: row.title,
          description: row.description,
          type: row.type,
          topic: row.topic,
          level: row.level,
          read_time: row.read_time,
          thumbnail_url: row.thumbnail_url,
          resource_url: row.resource_url,
          date_published: row.date_published,
          is_featured: row.is_featured,
          tags: row.tags,
          popularity: row.popularity,
          created_at: row.created_at,
          updated_at: row.updated_at,
          average_rating: parseFloat(row.average_rating) || undefined,
          rating_count: parseInt(row.rating_count) || undefined,
          is_bookmarked: row.is_bookmarked || false
        };
        
        // Add progress information if available
        if (row.progress_status) {
          resource.progress = {
            user_id: userId as number,
            resource_id: row.id,
            status: row.progress_status,
            progress_percent: row.progress_percent,
            last_accessed: row.last_accessed,
            created_at: row.created_at,
            updated_at: row.updated_at
          };
        }
        
        return resource;
      });
    } catch (error) {
      console.error('Error fetching educational resources:', error);
      throw new Error('Failed to fetch educational resources');
    }
  }

  /**
   * Get a single educational resource by ID
   */
  async getResourceById(id: number, userId?: number): Promise<EducationalResource | null> {
    try {
      const query = `
        SELECT 
          er.*,
          COALESCE(AVG(rr.rating), 0) as average_rating,
          COUNT(DISTINCT rr.id) as rating_count,
          CASE WHEN rb.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked,
          rp.status as progress_status,
          rp.progress_percent,
          rp.last_accessed
        FROM 
          educational_resources er
        LEFT JOIN 
          resource_ratings rr ON er.id = rr.resource_id
        LEFT JOIN 
          resource_bookmarks rb ON er.id = rb.resource_id AND rb.user_id = $1
        LEFT JOIN 
          resource_progress rp ON er.id = rp.resource_id AND rp.user_id = $1
        WHERE 
          er.id = $2
        GROUP BY 
          er.id, rb.user_id, rp.status, rp.progress_percent, rp.last_accessed
      `;

      const result = await db.query(query, [userId || null, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const resource: EducationalResource = {
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.type,
        topic: row.topic,
        level: row.level,
        read_time: row.read_time,
        thumbnail_url: row.thumbnail_url,
        resource_url: row.resource_url,
        date_published: row.date_published,
        is_featured: row.is_featured,
        tags: row.tags,
        popularity: row.popularity,
        created_at: row.created_at,
        updated_at: row.updated_at,
        average_rating: parseFloat(row.average_rating) || undefined,
        rating_count: parseInt(row.rating_count) || undefined,
        is_bookmarked: row.is_bookmarked || false
      };
      
      // Add progress information if available
      if (row.progress_status) {
        resource.progress = {
          user_id: userId as number,
          resource_id: row.id,
          status: row.progress_status,
          progress_percent: row.progress_percent,
          last_accessed: row.last_accessed,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      }
      
      // Update access record for authenticated users
      if (userId) {
        await this.recordResourceAccess(id, userId);
      }
      
      return resource;
    } catch (error) {
      console.error(`Error fetching resource with ID ${id}:`, error);
      throw new Error('Failed to fetch resource');
    }
  }

  /**
   * Get all collections, optionally with their resources
   */
  async getCollections(
    includeResources = false, 
    userId?: number
  ): Promise<ResourceCollection[]> {
    try {
      // Query for collections
      const collectionsQuery = `
        SELECT * FROM educational_collections
        ORDER BY title
      `;
      
      const collectionsResult = await db.query(collectionsQuery);
      const collections = collectionsResult.rows as ResourceCollection[];
      
      // If includeResources is true, get resources for each collection
      if (includeResources) {
        for (const collection of collections) {
          const resourcesQuery = `
            SELECT 
              er.*,
              cr.position,
              COALESCE(AVG(rr.rating), 0) as average_rating,
              COUNT(DISTINCT rr.id) as rating_count,
              CASE WHEN rb.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked,
              rp.status as progress_status,
              rp.progress_percent
            FROM 
              educational_resources er
            JOIN 
              collection_resources cr ON er.id = cr.resource_id
            LEFT JOIN 
              resource_ratings rr ON er.id = rr.resource_id
            LEFT JOIN 
              resource_bookmarks rb ON er.id = rb.resource_id AND rb.user_id = $1
            LEFT JOIN 
              resource_progress rp ON er.id = rp.resource_id AND rp.user_id = $1
            WHERE 
              cr.collection_id = $2
            GROUP BY 
              er.id, cr.position, rb.user_id, rp.status, rp.progress_percent
            ORDER BY 
              cr.position
          `;
          
          const resourcesResult = await db.query(resourcesQuery, [userId || null, collection.id]);
          
          collection.resources = resourcesResult.rows.map(row => {
            const resource: EducationalResource = {
              id: row.id,
              title: row.title,
              description: row.description,
              type: row.type,
              topic: row.topic,
              level: row.level,
              read_time: row.read_time,
              thumbnail_url: row.thumbnail_url,
              resource_url: row.resource_url,
              date_published: row.date_published,
              is_featured: row.is_featured,
              tags: row.tags,
              popularity: row.popularity,
              created_at: row.created_at,
              updated_at: row.updated_at,
              average_rating: parseFloat(row.average_rating) || undefined,
              rating_count: parseInt(row.rating_count) || undefined,
              is_bookmarked: row.is_bookmarked || false
            };
            
            // Add progress information if available
            if (row.progress_status) {
              resource.progress = {
                user_id: userId as number,
                resource_id: row.id,
                status: row.progress_status,
                progress_percent: row.progress_percent,
                last_accessed: row.last_accessed,
                created_at: row.created_at,
                updated_at: row.updated_at
              };
            }
            
            return resource;
          });
        }
      }
      
      return collections;
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw new Error('Failed to fetch collections');
    }
  }

  /**
   * Get bookmarked resources for a user
   */
  async getUserBookmarks(userId: number): Promise<EducationalResource[]> {
    try {
      const query = `
        SELECT 
          er.*,
          rb.created_at as bookmark_date,
          COALESCE(AVG(rr.rating), 0) as average_rating,
          COUNT(DISTINCT rr.id) as rating_count,
          rp.status as progress_status,
          rp.progress_percent
        FROM 
          resource_bookmarks rb
        JOIN 
          educational_resources er ON rb.resource_id = er.id
        LEFT JOIN 
          resource_ratings rr ON er.id = rr.resource_id
        LEFT JOIN 
          resource_progress rp ON er.id = rp.resource_id AND rp.user_id = $1
        WHERE 
          rb.user_id = $1
        GROUP BY 
          er.id, rb.created_at, rp.status, rp.progress_percent
        ORDER BY 
          rb.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      
      return result.rows.map(row => {
        const resource: EducationalResource = {
          id: row.id,
          title: row.title,
          description: row.description,
          type: row.type,
          topic: row.topic,
          level: row.level,
          read_time: row.read_time,
          thumbnail_url: row.thumbnail_url,
          resource_url: row.resource_url,
          date_published: row.date_published,
          is_featured: row.is_featured,
          tags: row.tags,
          popularity: row.popularity,
          created_at: row.created_at,
          updated_at: row.updated_at,
          average_rating: parseFloat(row.average_rating) || undefined,
          rating_count: parseInt(row.rating_count) || undefined,
          is_bookmarked: true
        };
        
        // Add progress information if available
        if (row.progress_status) {
          resource.progress = {
            user_id: userId,
            resource_id: row.id,
            status: row.progress_status,
            progress_percent: row.progress_percent,
            last_accessed: row.last_accessed,
            created_at: row.created_at,
            updated_at: row.updated_at
          };
        }
        
        return resource;
      });
    } catch (error) {
      console.error(`Error fetching bookmarks for user ${userId}:`, error);
      throw new Error('Failed to fetch bookmarks');
    }
  }

  /**
   * Add a bookmark
   */
  async addBookmark(userId: number, { resource_id }: BookmarkRequest): Promise<ResourceBookmark> {
    try {
      const query = `
        INSERT INTO resource_bookmarks (user_id, resource_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const result = await db.query(query, [userId, resource_id]);
      
      return result.rows[0] as ResourceBookmark;
    } catch (error) {
      console.error(`Error adding bookmark for user ${userId}:`, error);
      throw new Error('Failed to add bookmark');
    }
  }

  /**
   * Remove a bookmark
   */
  async removeBookmark(userId: number, resourceId: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM resource_bookmarks
        WHERE user_id = $1 AND resource_id = $2
        RETURNING *
      `;
      
      const result = await db.query(query, [userId, resourceId]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error removing bookmark for user ${userId}:`, error);
      throw new Error('Failed to remove bookmark');
    }
  }

  /**
   * Get user progress for all resources
   */
  async getUserProgress(userId: number): Promise<ResourceProgress[]> {
    try {
      const query = `
        SELECT rp.*, er.title
        FROM resource_progress rp
        JOIN educational_resources er ON rp.resource_id = er.id
        WHERE rp.user_id = $1
        ORDER BY rp.last_accessed DESC
      `;
      
      const result = await db.query(query, [userId]);
      
      return result.rows as ResourceProgress[];
    } catch (error) {
      console.error(`Error fetching progress for user ${userId}:`, error);
      throw new Error('Failed to fetch progress');
    }
  }

  /**
   * Update user progress for a resource
   */
  async updateProgress(
    userId: number, 
    { resource_id, status, progress_percent }: ProgressUpdateRequest
  ): Promise<ResourceProgress> {
    try {
      // Check if entry exists
      const checkQuery = `
        SELECT * FROM resource_progress
        WHERE user_id = $1 AND resource_id = $2
      `;
      
      const checkResult = await db.query(checkQuery, [userId, resource_id]);
      
      let query: string;
      let params: any[];
      
      if (checkResult.rows.length === 0) {
        // Insert new progress record
        query = `
          INSERT INTO resource_progress 
            (user_id, resource_id, status, progress_percent, last_accessed)
          VALUES 
            ($1, $2, $3, $4, NOW())
          RETURNING *
        `;
        
        params = [
          userId, 
          resource_id, 
          status || 'in_progress', 
          progress_percent || 0
        ];
      } else {
        // Update existing progress record
        query = `
          UPDATE resource_progress
          SET 
            status = COALESCE($3, status),
            progress_percent = COALESCE($4, progress_percent),
            last_accessed = NOW(),
            updated_at = NOW()
          WHERE 
            user_id = $1 AND resource_id = $2
          RETURNING *
        `;
        
        params = [
          userId, 
          resource_id, 
          status || null, 
          progress_percent !== undefined ? progress_percent : null
        ];
      }
      
      const result = await db.query(query, params);
      
      return result.rows[0] as ResourceProgress;
    } catch (error) {
      console.error(`Error updating progress for user ${userId}:`, error);
      throw new Error('Failed to update progress');
    }
  }

  /**
   * Record that a user accessed a resource
   * This is used to track views and update the last_accessed timestamp
   */
  async recordResourceAccess(resourceId: number, userId: number): Promise<void> {
    try {
      // Check if entry exists
      const checkQuery = `
        SELECT * FROM resource_progress
        WHERE user_id = $1 AND resource_id = $2
      `;
      
      const checkResult = await db.query(checkQuery, [userId, resourceId]);
      
      if (checkResult.rows.length === 0) {
        // Create new progress entry with not_started status
        const insertQuery = `
          INSERT INTO resource_progress 
            (user_id, resource_id, status, progress_percent, last_accessed)
          VALUES 
            ($1, $2, 'not_started', 0, NOW())
        `;
        
        await db.query(insertQuery, [userId, resourceId]);
      } else {
        // Just update the last_accessed timestamp
        const updateQuery = `
          UPDATE resource_progress
          SET last_accessed = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND resource_id = $2
        `;
        
        await db.query(updateQuery, [userId, resourceId]);
      }
      
      // Increment popularity independently (triggers will handle aggregation for bookmarks, etc.)
      const updatePopularityQuery = `
        UPDATE educational_resources
        SET popularity = popularity + 1
        WHERE id = $1
      `;
      
      await db.query(updatePopularityQuery, [resourceId]);
    } catch (error) {
      console.error(`Error recording resource access for user ${userId}:`, error);
      // Don't throw an error as this is a background operation
      // that shouldn't fail the main request
    }
  }

  /**
   * Get ratings for a resource
   */
  async getResourceRatings(resourceId: number): Promise<ResourceRating[]> {
    try {
      const query = `
        SELECT rr.*, u.name as user_name
        FROM resource_ratings rr
        JOIN users u ON rr.user_id = u.id
        WHERE rr.resource_id = $1
        ORDER BY rr.created_at DESC
      `;
      
      const result = await db.query(query, [resourceId]);
      
      return result.rows as ResourceRating[];
    } catch (error) {
      console.error(`Error fetching ratings for resource ${resourceId}:`, error);
      throw new Error('Failed to fetch ratings');
    }
  }

  /**
   * Get a user's rating for a resource
   */
  async getUserRating(userId: number, resourceId: number): Promise<ResourceRating | null> {
    try {
      const query = `
        SELECT * FROM resource_ratings
        WHERE user_id = $1 AND resource_id = $2
      `;
      
      const result = await db.query(query, [userId, resourceId]);
      
      return result.rows.length > 0 ? result.rows[0] as ResourceRating : null;
    } catch (error) {
      console.error(`Error fetching rating from user ${userId} for resource ${resourceId}:`, error);
      throw new Error('Failed to fetch rating');
    }
  }

  /**
   * Rate a resource
   */
  async rateResource(
    userId: number, 
    { resource_id, rating, review }: RatingRequest
  ): Promise<ResourceRating> {
    try {
      // Check if user has already rated this resource
      const existingRating = await this.getUserRating(userId, resource_id);
      
      let query: string;
      let params: any[];
      
      if (existingRating) {
        // Update existing rating
        query = `
          UPDATE resource_ratings
          SET rating = $3, review = $4, updated_at = NOW()
          WHERE user_id = $1 AND resource_id = $2
          RETURNING *
        `;
        
        params = [userId, resource_id, rating, review || null];
      } else {
        // Insert new rating
        query = `
          INSERT INTO resource_ratings (user_id, resource_id, rating, review)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        
        params = [userId, resource_id, rating, review || null];
      }
      
      const result = await db.query(query, params);
      
      return result.rows[0] as ResourceRating;
    } catch (error) {
      console.error(`Error rating resource ${resource_id} by user ${userId}:`, error);
      throw new Error('Failed to rate resource');
    }
  }

  /**
   * Delete a rating
   */
  async deleteRating(userId: number, resourceId: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM resource_ratings
        WHERE user_id = $1 AND resource_id = $2
        RETURNING *
      `;
      
      const result = await db.query(query, [userId, resourceId]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting rating for resource ${resourceId} by user ${userId}:`, error);
      throw new Error('Failed to delete rating');
    }
  }
}

export default new EducationService();
