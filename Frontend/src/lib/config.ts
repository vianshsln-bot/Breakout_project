export const API_BASE_URL = 'https://breakout-project.onrender.com';
export const API_CHARTS_BASE_URL = 'https://breakout-project-homepage.onrender.com/api/dashboard';
export const XI_BASE_URL = 'https://api.elevenlabs.io/v1/convai';
export let XI_API_KEY = process.env.NEXT_PUBLIC_XI_API_KEY || '';

export function setXiApiKey(newKey: string) {
  XI_API_KEY = newKey;
}
