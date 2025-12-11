import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@poultry_cache_';
const CACHE_EXPIRY_PREFIX = '@poultry_cache_expiry_';
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheOptions {
  duration?: number; // Cache duration in milliseconds
}

/**
 * Set a value in the cache with optional expiry
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const { duration = DEFAULT_CACHE_DURATION } = options;
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(value));
    await AsyncStorage.setItem(expiryKey, String(Date.now() + duration));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

/**
 * Get a value from the cache
 * Returns null if the cache is expired or doesn't exist
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

  try {
    const expiryStr = await AsyncStorage.getItem(expiryKey);
    if (!expiryStr) return null;

    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      // Cache expired, remove it
      await removeCache(key);
      return null;
    }

    const valueStr = await AsyncStorage.getItem(cacheKey);
    if (!valueStr) return null;

    return JSON.parse(valueStr) as T;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

/**
 * Remove a value from the cache
 */
export async function removeCache(key: string): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

  try {
    await AsyncStorage.multiRemove([cacheKey, expiryKey]);
  } catch (error) {
    console.error('Error removing cache:', error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cached data or fetch from source
 * Useful for implementing stale-while-revalidate pattern
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const freshData = await fetchFn();

  // Cache the fresh data
  await setCache(key, freshData, options);

  return freshData;
}

/**
 * Offline queue for operations that need to be synced
 */
const OFFLINE_QUEUE_KEY = '@poultry_offline_queue';

interface QueuedOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export async function addToOfflineQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const newOperation: QueuedOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(newOperation);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
}

export async function getOfflineQueue(): Promise<QueuedOperation[]> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

export async function removeFromOfflineQueue(operationId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filteredQueue = queue.filter((op) => op.id !== operationId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
}
