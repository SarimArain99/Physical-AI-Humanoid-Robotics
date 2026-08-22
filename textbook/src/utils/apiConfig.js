export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    // Production URL (Update this once you deploy the backend to Vercel!)
    return 'https://physical-ai-backend-mu.vercel.app';
  }
  return 'http://localhost:8000'; // Default for SSR
};
