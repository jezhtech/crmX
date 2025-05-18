/**
 * Utility to proxy requests through a CORS-enabled endpoint
 */

const CORS_ANYWHERE_URL = 'https://cors-anywhere.herokuapp.com/';

/**
 * Proxy a URL through a CORS proxy
 * @param url The URL to proxy
 * @returns The proxied URL
 */
export const proxyUrl = (url: string): string => {
  return `${CORS_ANYWHERE_URL}${url}`;
};

/**
 * Make a fetch request through a CORS proxy 
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise with the fetch response
 */
export const proxyFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  // First try direct fetch
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.warn('Direct fetch failed, trying CORS proxy:', error);
    
    // If direct fetch fails with CORS error, try using the proxy
    const proxiedUrl = proxyUrl(url);
    
    // Add headers needed for the proxy
    const proxiedOptions = {
      ...options,
      headers: {
        ...(options?.headers || {}),
        'X-Requested-With': 'XMLHttpRequest',
      },
    };
    
    return fetch(proxiedUrl, proxiedOptions);
  }
}; 