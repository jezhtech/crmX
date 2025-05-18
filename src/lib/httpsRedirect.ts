/**
 * Utility to redirect HTTP traffic to HTTPS
 * This should be imported and used in the main application entry point
 */

export const enforceHttps = (): void => {
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'http:') {
    // Only redirect if not on localhost without a domain
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const newUrl = `https://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${window.location.pathname}${window.location.search}`;
      window.location.href = newUrl;
    }
  }
};

/**
 * Utility to check if we're running on a secure context
 */
export const isSecureContext = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.isSecureContext;
  }
  return false;
}; 