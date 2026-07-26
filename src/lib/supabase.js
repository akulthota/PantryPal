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

// Initial clean default preferences (No pre-selected presets)
const DEFAULT_PREFERENCES = {
  dietary_restrictions: [],
  favorite_cuisines: [],
  allergies: [],
  cooking_skill: 'Intermediate',
  daily_protein_goal: 80
};

// Clean empty recipes array (No hardcoded default recipes)
const DEFAULT_RECIPES = [];

const DEFAULT_PROTEIN_LOGS = [];

// Helper functions for LocalStorage fallback
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

// Unified Data Services (Supabase + LocalStorage Fallback)
export const db = {
  recipes: {
    async list() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) return data;
        } catch (e) {
          console.warn('Supabase fetch error, using local storage:', e);
        }
      }
      return getLocal('recipes', DEFAULT_RECIPES);
    },
    async create(recipe) {
      const newRecipe = {
        ...recipe,
        id: recipe.id || `rec-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('recipes')
            .insert([newRecipe])
            .select();
          if (!error && data?.[0]) return data[0];
        } catch (e) {
          console.warn('Supabase insert error, using local storage:', e);
        }
      }
      const list = getLocal('recipes', DEFAULT_RECIPES);
      const updated = [newRecipe, ...list];
      setLocal('recipes', updated);
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
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('protein_logs')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) return data;
        } catch (e) {}
      }
      return getLocal('protein_logs', DEFAULT_PROTEIN_LOGS);
    },
    async create(entry) {
      const newEntry = {
        ...entry,
        id: `prot-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('protein_logs')
            .insert([newEntry])
            .select();
          if (!error && data?.[0]) return data[0];
        } catch (e) {}
      }
      const list = getLocal('protein_logs', DEFAULT_PROTEIN_LOGS);
      const updated = [newEntry, ...list];
      setLocal('protein_logs', updated);
      return newEntry;
    },
    async delete(id) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('protein_logs').delete().eq('id', id);
        } catch (e) {}
      }
      const list = getLocal('protein_logs', DEFAULT_PROTEIN_LOGS);
      const updated = list.filter(p => p.id !== id);
      setLocal('protein_logs', updated);
      return true;
    }
  },

  preferences: {
    async get() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .single();
          if (!error && data) return data;
        } catch (e) {}
      }
      return getLocal('user_preferences', DEFAULT_PREFERENCES);
    },
    async update(prefs) {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .upsert([{ user_id: 'guest', ...prefs, updated_at: new Date().toISOString() }])
            .select();
          if (!error && data?.[0]) return data[0];
        } catch (e) {}
      }
      setLocal('user_preferences', prefs);
      return prefs;
    }
  },

  scanLogs: {
    async list() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('scan_logs')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) return data;
        } catch (e) {}
      }
      return getLocal('scan_logs', []);
    },
    async create(scan) {
      const newScan = {
        ...scan,
        id: `scan-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('scan_logs').insert([newScan]);
        } catch (e) {}
      }
      const list = getLocal('scan_logs', []);
      setLocal('scan_logs', [newScan, ...list]);
      return newScan;
    }
  }
};
