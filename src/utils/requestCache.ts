/**
 * Simple utility to manage and abort API requests
 */

type AbortableRequests = {
  [key: string]: AbortController;
};

class RequestCache {
  private abortControllers: AbortableRequests = {};
  
  /**
   * Create a new abort controller for a request
   */
  public getAbortController(requestKey: string): AbortController {
    // Cancel existing request with the same key if it exists
    this.abortRequest(requestKey);
    
    // Create a new controller
    const controller = new AbortController();
    this.abortControllers[requestKey] = controller;
    
    return controller;
  }
  
  /**
   * Abort a request by key
   */
  public abortRequest(requestKey: string): void {
    if (this.abortControllers[requestKey]) {
      try {
        this.abortControllers[requestKey].abort();
      } catch (error) {
        console.error('Error aborting request:', error);
      }
      
      // Remove the aborted controller
      delete this.abortControllers[requestKey];
    }
  }
  
  /**
   * Abort all tracked requests
   */
  public abortAllRequests(): void {
    Object.keys(this.abortControllers).forEach(key => {
      this.abortRequest(key);
    });
  }
}

export const requestCache = new RequestCache();
