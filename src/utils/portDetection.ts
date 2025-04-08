/**
 * Utility functions for detecting available ports and managing API URLs
 */

// Cache the detected URL to avoid repeated checks
let detectedBaseUrl: string | null = null;

/**
 * Attempts to connect to a specific port
 */
async function checkPort(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/`, {
      method: 'HEAD',
      // Short timeout to quickly check port availability
      signal: AbortSignal.timeout(1000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Finds the first available port from a list of ports
 */
export async function findAvailablePort(ports: number[] = [5173, 5174]): Promise<number> {
  for (const port of ports) {
    if (await checkPort(port)) {
      return port;
    }
  }
  throw new Error('No available development server found');
}

/**
 * Gets the base URL for the frontend, with caching
 */
export async function getBaseUrl(): Promise<string> {
  if (detectedBaseUrl) {
    return detectedBaseUrl;
  }

  try {
    const port = await findAvailablePort();
    detectedBaseUrl = `http://localhost:${port}`;
    return detectedBaseUrl;
  } catch (error) {
    console.error('Failed to detect development server:', error);
    // Default to 5173 if detection fails
    return 'http://localhost:5173';
  }
}

/**
 * Resets the cached base URL, forcing a new detection on next getBaseUrl call
 */
export function resetBaseUrl(): void {
  detectedBaseUrl = null;
}
