import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client = null;
let configured = false;

try {
  if (
    typeof supabaseUrl === 'string' &&
    typeof supabaseAnonKey === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-supabase-project') &&
    !supabaseAnonKey.includes('service_role')
  ) {
    client = createClient(supabaseUrl, supabaseAnonKey);
    configured = true;
  }
} catch (e) {
  console.warn('Supabase initialization fallback active:', e);
}

export const isSupabaseConfigured = configured;
export const supabase = client;

const DEFAULT_PREFERENCES = {
  dietary_restrictions: [],
  favorite_cuisines: [],
  allergies: [],
  cooking_skill: 'Intermediate',
  daily_protein_goal: 80
};

const DEFAULT_RECIPES = [];
const DEFAULT_PROTEIN_LOGS = [];

const getLocal = (key, fallback) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const data = localStorage.getItem(`pantrypal_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = (key, value) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`pantrypal_${key}`, JSON.stringify(value));
    }
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

const getUserId = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id || null;
    } catch {
      return null;
    }
  }
  return null;
};

export const db = {
  recipes: {
    async list() {
      let remoteRecipes = [];
      const userId = await getUserId();

      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase.from('recipes').select('*').order('created_at', { ascending: false });
          if (userId) {
            query = query.eq('user_id', userId);
          }
          const { data, error } = await query;
          if (!error && data) remoteRecipes = data;
        } catch (e) {
          console.warn('Supabase recipe fetch error:', e);
        }
      }

      const localRecipes = getLocal('recipes', DEFAULT_RECIPES);
      
      // Combine local recipes (newer/edited) first, then remote recipes
      const map = new Map();
      [...localRecipes, ...remoteRecipes].forEach(r => {
        if (r && (r.id || r.title)) {
          const key = r.id || r.title;
          if (!map.has(key)) map.set(key, r);
        }
      });
      return Array.from(map.values());
    },

    async create(recipe) {
      const userId = await getUserId();
      const newRecipe = {
        ...recipe,
        id: recipe.id || `rec-${Date.now()}`,
        user_id: userId || 'guest',
        created_at: new Date().toISOString()
      };

      // 1. Immediately update LocalStorage
      const list = getLocal('recipes', DEFAULT_RECIPES);
      const updatedLocal = [newRecipe, ...list.filter(r => r.id !== newRecipe.id)];
      setLocal('recipes', updatedLocal);

      // 2. Sync to Supabase Cloud Database for cross-device access
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('recipes')
            .upsert([newRecipe])
            .select();
          if (!error && data?.[0]) return data[0];
        } catch (e) {
          console.warn('Supabase recipe sync warning, saved locally:', e);
        }
      }
      return newRecipe;
    },

    async delete(id) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('recipes').delete().eq('id', id);
        } catch (e) {}
      }
      const list = getLocal('recipes', DEFAULT_RECIPES);
      const updated = list.filter(r => r.id !== id);
      setLocal('recipes', updated);
      return true;
    }
  },

  proteinLogs: {
    async list() {
      let remoteLogs = [];
      const userId = await getUserId();

      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase.from('protein_logs').select('*').order('created_at', { ascending: false });
          if (userId) {
            query = query.eq('user_id', userId);
          }
          const { data, error } = await query;
          if (!error && data) remoteLogs = data;
        } catch (e) {}
      }

      const localLogs = getLocal('protein_logs', DEFAULT_PROTEIN_LOGS);
      const map = new Map();
      [...localLogs, ...remoteLogs].forEach(l => {
        if (l && l.id && !map.has(l.id)) map.set(l.id, l);
      });
      return Array.from(map.values());
    },

    async create(entry) {
      const userId = await getUserId();
      const newEntry = {
        ...entry,
        id: entry.id || `prot-${Date.now()}`,
        user_id: userId || 'guest',
        created_at: new Date().toISOString()
      };

      const list = getLocal('protein_logs', DEFAULT_PROTEIN_LOGS);
      setLocal('protein_logs', [newEntry, ...list.filter(l => l.id !== newEntry.id)]);

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('protein_logs')
            .upsert([newEntry])
            .select();
          if (!error && data?.[0]) return data[0];
        } catch (e) {}
      }
      return newEntry;
    },

    async delete(id) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('protein_logs').delete().eq('id', id);
        } catch (e) {}
      }
      const list = getLocal('protein_logs', DEFAULT_PROTEIN_LOGS);
      setLocal('protein_logs', list.filter(p => p.id !== id));
      return true;
    }
  },

  preferences: {
    async get() {
      const userId = await getUserId();
      const localPrefs = getLocal('user_preferences', DEFAULT_PREFERENCES);
      if (isSupabaseConfigured && supabase && userId) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          if (!error && data) {
            const merged = { ...DEFAULT_PREFERENCES, ...localPrefs, ...data };
            setLocal('user_preferences', merged);
            return merged;
          }
        } catch (e) {}
      }
      return localPrefs;
    },

    async update(prefs) {
      const userId = await getUserId();
      setLocal('user_preferences', prefs);
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .upsert([{ user_id: userId || 'guest', ...prefs, updated_at: new Date().toISOString() }])
            .select();
          if (!error && data?.[0]) return data[0];
        } catch (e) {}
      }
      return prefs;
    }
  },

  scanLogs: {
    async list() {
      let remoteScans = [];
      const userId = await getUserId();

      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase.from('scan_logs').select('*').order('created_at', { ascending: false });
          if (userId) {
            query = query.eq('user_id', userId);
          }
          const { data, error } = await query;
          if (!error && data) remoteScans = data;
        } catch (e) {}
      }

      const localScans = getLocal('scan_logs', []);
      const map = new Map();
      [...localScans, ...remoteScans].forEach(s => {
        if (s && s.id && !map.has(s.id)) map.set(s.id, s);
      });
      return Array.from(map.values());
    },

    async create(scan) {
      const userId = await getUserId();
      const newScan = {
        ...scan,
        id: `scan-${Date.now()}`,
        user_id: userId || 'guest',
        created_at: new Date().toISOString()
      };
      const list = getLocal('scan_logs', []);
      setLocal('scan_logs', [newScan, ...list]);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('scan_logs').insert([newScan]);
        } catch (e) {}
      }
      return newScan;
    }
  }
};

