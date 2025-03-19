# Rate Limiting Fixes for Products API

## Issue Summary
Users were experiencing "Too Many Requests" errors when interacting with products - particularly when clicking into a product or searching for products. This was due to insufficient rate limits that couldn't handle the increased traffic, especially after implementing the detailed product view feature.

## Changes Implemented

### 1. Enhanced Rate Limit Middleware

Modified `rateLimitMiddleware.ts` to:

- **Add specialized rate limiters** for different product operations:
  - General products: 3000 requests per 5 minutes (doubled from 1500)
  - Product detail views: 800 requests per 1 minute with skip successful requests option
  - Product searches: 500 requests per minute
  
- **Improved the rate limiter creation function**:
  - Added support for skipping successful requests
  - Added better documentation
  - Made the function more flexible for different use cases

### 2. Applied Specific Rate Limiters to Routes

#### In Products Router (`products.ts`):
- Used dynamic middleware selection for the main products route:
  - Apply search-specific limiter when search parameter is present
  - Apply general products limiter otherwise
- Applied product detail-specific limiters to detail-related endpoints:
  - Single product retrieval
  - Similar products
  - Energy savings calculations

#### In Product Recommendations Router (`productRecommendations.ts`):
- Applied search-specific limiters to category and feature endpoints
- Applied product detail limiter to the detailed product info endpoint

## Expected Outcomes

These changes should significantly reduce the "Too Many Requests" errors by:

1. **Increasing overall limits** to accommodate higher traffic
2. **Separating rate limits by operation type** so that one operation type (e.g., searching) doesn't block others
3. **Optimizing counting** by skipping successful requests in some cases
4. **Providing finer control** over different types of API usage

## Monitoring and Future Considerations

- Monitor API usage after deployment to verify the effectiveness of these changes
- Consider implementing further optimizations like:
  - Server-side caching for frequent queries
  - Pagination improvements
  - Client-side request batching
  - Enhanced error responses with retry information
