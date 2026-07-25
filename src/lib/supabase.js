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
    !supabaseAnonKey.includes('service_role') // Prevent using secret service_role key in browser
  ) {
    client = createClient(supabaseUrl, supabaseAnonKey);
    configured = true;
  } else if (supabaseAnonKey.includes('service_role')) {
    console.warn('PantryPal Warning: VITE_SUPABASE_ANON_KEY is set to a secret service_role key! Please replace it with the public anon key in Vercel.');
  }
} catch (e) {
  console.warn('Supabase initialization fallback active:', e);
}

export const isSupabaseConfigured = configured;
export const supabase = client;

// Initial sample data for standalone fallback
const DEFAULT_PREFERENCES = {
  dietary_restrictions: ['Vegetarian'],
  favorite_cuisines: ['Italian', 'Mediterranean'],
  allergies: [],
  cooking_skill: 'Intermediate',
  daily_protein_goal: 80
};

const DEFAULT_RECIPES = [
  {
    id: 'rec-1',
    title: 'Mediterranean Chickpea & Vegetable Skillet',
    cuisine_type: 'Mediterranean',
    prep_time: '15 mins',
    servings: '2',
    difficulty: 'Easy',
    ingredients: [
      '1 can (15 oz) Chickpeas, rinsed and drained',
      '1 Red Bell Pepper, diced',
      '1 Zucchini, sliced',
      '2 cloves Garlic, minced',
      '2 tbsp Olive Oil',
      '1 tsp Dried Oregano',
      '1/2 cup Feta Cheese, crumbled',
      'Fresh Parsley for garnish'
    ],
    instructions: [
      'Heat olive oil in a large skillet over medium-high heat.',
      'Add minced garlic and sauté for 1 minute until fragrant.',
      'Add diced bell pepper and zucchini slices; cook for 5-7 minutes until tender.',
      'Stir in drained chickpeas, oregano, salt, and black pepper. Sauté for 3 additional minutes.',
      'Remove from heat, top with crumbled feta and fresh parsley. Serve warm.'
    ],
    nutrition: {
      calories: 380,
      protein: 16,
      carbs: 45,
      fat: 14,
      fiber: 10
    },
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'rec-2',
    title: 'Garlic Butter Salmon with Asparagus',
    cuisine_type: 'American',
    prep_time: '20 mins',
    servings: '2',
    difficulty: 'Intermediate',
    ingredients: [
      '2 Salmon Filets (6 oz each)',
      '1 bunch Asparagus, trimmed',
      '2 tbsp Butter, melted',
      '3 cloves Garlic, minced',
      '1 Lemon, sliced & juiced',
      'Salt & Lemon Pepper to taste'
    ],
    instructions: [
      'Preheat oven to 400°F (200°C) or prepare a large skillet.',
      'Combine melted butter, minced garlic, lemon juice, salt, and pepper.',
      'Place salmon fillets and trimmed asparagus on a lined baking tray.',
      'Drizzle garlic butter mixture generously over salmon and asparagus.',
      'Bake for 12-15 minutes until salmon flakes easily with a fork.'
    ],
    nutrition: {
      calories: 490,
      protein: 42,
      carbs: 8,
      fat: 32,
      fiber: 4
    },
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

const DEFAULT_PROTEIN_LOGS = [
  {
    id: 'prot-1',
    item: 'Greek Yogurt & Protein Powder Smoothie',
    total_protein: 34,
    animal_protein: 0,
    plant_protein: 10,
    dairy_protein: 24,
    total_calories: 310,
    total_fiber: 4,
    logged_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  },
  {
    id: 'prot-2',
    item: 'Grilled Chicken Breast Bowl',
    total_protein: 42,
    animal_protein: 42,
    plant_protein: 0,
    dairy_protein: 0,
    total_calories: 380,
    total_fiber: 2,
    logged_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  }
];

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
