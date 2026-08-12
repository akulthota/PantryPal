// src/lib/spoonacular.js
const cache = new Map();
const MAX_CACHE_SIZE = 50;

function getCached(key) {
  if (cache.has(key)) {
    const val = cache.get(key);
    // Refresh position for LRU eviction
    cache.delete(key);
    cache.set(key, val);
    return val;
  }
  try {
    const item = sessionStorage.getItem(`spoon_cache_${key}`);
    if (item) {
      const parsed = JSON.parse(item);
      setCache(key, parsed);
      return parsed;
    }
  } catch (e) {}
  return null;
}

function setCache(key, data) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, data);
  try {
    sessionStorage.setItem(`spoon_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // If sessionStorage quota is exceeded, clear old spoon keys
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('spoon_cache_'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch (clearErr) {}
  }
}


export async function searchRecipes({ query = '', cuisine = '', number = 12, offset = 0 } = {}) {
  const cacheKey = `search_${query}_${cuisine}_${number}_${offset}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ action: 'search', query, cuisine, number: String(number), offset: String(offset) });
  try {
    const res = await fetch(`/api/spoonacular?${params}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Spoonacular search proxy fetch failed:', err);
    return { results: [], totalResults: 0 };
  }
}

export async function getRecipeDetails(id) {
  if (!id) return null;
  const cacheKey = `details_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/spoonacular?action=details&id=${id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Spoonacular details fetch failed:', err);
    return null;
  }
}

export async function getRandomRecipes(number = 12, tags = '') {
  const cacheKey = `random_${number}_${tags}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ action: 'random', number: String(number), tags });
  try {
    const res = await fetch(`/api/spoonacular?${params}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const recipes = data.recipes || data.results || [];
    setCache(cacheKey, recipes);
    return recipes;
  } catch (err) {
    console.warn('Spoonacular random fetch failed:', err);
    return [];
  }
}

export async function autocompleteIngredient(query, number = 10) {
  if (!query || query.trim().length === 0) return [];
  const cacheKey = `autocomplete_${query.trim().toLowerCase()}_${number}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ action: 'autocomplete', query: query.trim(), number: String(number) });
  try {
    const res = await fetch(`/api/spoonacular?${params}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const result = Array.isArray(data) ? data : [];
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Spoonacular autocomplete fetch failed:', err);
    throw err;
  }
}

export async function findByIngredients(ingredients, number = 12) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return [];
  const ingStr = ingredients.join(',');
  const cacheKey = `byIng_${ingStr}_${number}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ action: 'byIngredients', ingredients: ingStr, number: String(number) });
  try {
    const res = await fetch(`/api/spoonacular?${params}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Spoonacular findByIngredients fetch failed:', err);
    return [];
  }
}
