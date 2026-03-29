// API-Football integration service
// Uses AWS Lambda backend

// Backend API URL - Lambda API Gateway
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Cache settings
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PREFIX = 'api_football_';

interface CacheData<T> {
  data: T;
  timestamp: number;
}

// Cache management
const getFromCache = <T>(key: string): T | null => {
  const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
  if (!cached) return null;

  const parsed: CacheData<T> = JSON.parse(cached);
  const now = Date.now();

  if (now - parsed.timestamp < CACHE_DURATION) {
    console.log(`Cache hit for ${key}`);
    return parsed.data;
  }

  localStorage.removeItem(CACHE_KEY_PREFIX + key);
  return null;
};

const saveToCache = <T>(key: string, data: T): void => {
  const cacheData: CacheData<T> = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheData));
  console.log(`Cached ${key}`);
};

// API request wrapper
const apiRequest = async <T>(endpoint: string): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('Making request to:', url); // ADD THIS

  const response = await fetch(url);
  console.log('Response status:', response.status); // ADD THIS

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Response data:', data); // ADD THIS
  return data;
};

// Fetch World Cup 2026 fixtures
export const fetchWorldCupFixtures = async (forceRefresh = false): Promise<any[]> => {
  const cacheKey = 'world_cup_2022_fixtures';

  if (!forceRefresh) {
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;
  }

  console.log('Fetching fixtures from Lambda...');

  const fixtures = await apiRequest<any[]>('/api/fixtures');

  saveToCache(cacheKey, fixtures);
  return fixtures;
};

// Fetch specific fixture by ID
export const fetchFixtureById = async (fixtureId: number, forceRefresh = false): Promise<any> => {
  const cacheKey = `fixture_${fixtureId}`;

  if (!forceRefresh) {
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;
  }

  console.log(`Fetching fixture ${fixtureId} from Lambda...`);

  const fixture = await apiRequest<any>(`/api/fixture/${fixtureId}`);

  saveToCache(cacheKey, fixture);
  return fixture;
};

// Fetch standings
export const fetchWorldCupStandings = async (forceRefresh = false): Promise<any[]> => {
  const cacheKey = 'world_cup_2026_standings';

  if (!forceRefresh) {
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;
  }

  console.log('Fetching standings from Lambda...');

  const standings = await apiRequest<any[]>('/api/standings');

  saveToCache(cacheKey, standings);
  return standings;
};

// Clear all cache
export const clearCache = (): void => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('Cache cleared');
};

// Get cache info
export const getCacheInfo = (): { key: string; age: string }[] => {
  const info: { key: string; age: string }[] = [];

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(CACHE_KEY_PREFIX)) {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed: CacheData<any> = JSON.parse(cached);
        const ageHours = Math.floor((Date.now() - parsed.timestamp) / (1000 * 60 * 60));
        info.push({
          key: key.replace(CACHE_KEY_PREFIX, ''),
          age: `${ageHours}h ago`,
        });
      }
    }
  });

  return info;
};
