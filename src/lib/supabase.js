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

const DEFAULT_RECIPES = [
  {
    id: 'starter-salmon',
    title: 'Garlic Butter Herb Salmon with Steamed Asparagus',
    cuisine_type: 'Mediterranean',
    prep_time: '20 mins',
    servings: '2',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    ingredients: [
      '2 fresh salmon fillets (6 oz each)',
      '1 bunch fresh green asparagus, trimmed',
      '3 cloves garlic, minced',
      '2 tbsp unsalted butter',
      '1 tbsp extra virgin olive oil',
      '1 fresh lemon, juiced and sliced',
      'Fresh chopped dill or parsley',
      'Sea salt & cracked black pepper to taste'
    ],
    instructions: [
      'Pat salmon fillets dry with paper towels; season both sides generously with sea salt, pepper, and minced garlic.',
      'Heat olive oil and 1 tbsp butter in a cast-iron skillet over medium-high heat until sizzling.',
      'Place salmon fillets skin-side down; sear undisturbed for 4-5 minutes until crisp and golden.',
      'Flip salmon, toss in the asparagus spears and remaining butter, and spoon melted herb butter over the fish for 3-4 minutes.',
      'Squeeze fresh lemon juice over everything and garnish with fresh dill before serving warm.'
    ],
    nutrition: {
      calories: 460,
      protein: 42,
      carbs: 8,
      fat: 28,
      fiber: 4
    },
    youtube_search_query: 'Garlic Butter Salmon with Asparagus recipe',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'starter-tuscan-bean',
    title: 'Rustic Tuscan White Bean & Tomato Skillet',
    cuisine_type: 'Italian',
    prep_time: '18 mins',
    servings: '3',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
    ingredients: [
      '2 cans (15 oz) cannellini white beans, rinsed and drained',
      '1 can (14 oz) fire-roasted crushed tomatoes',
      '3 cups fresh baby spinach or kale',
      '4 cloves garlic, thinly sliced',
      '2 tbsp extra virgin olive oil',
      '1/2 tsp crushed red pepper flakes',
      '1/4 cup grated Parmesan cheese (or nutritional yeast)',
      'Warm crusty sourdough bread for serving'
    ],
    instructions: [
      'Heat olive oil in a deep skillet over medium heat. Sauté garlic and red pepper flakes for 60 seconds until fragrant.',
      'Add crushed fire-roasted tomatoes and let simmer gently for 5 minutes until reduced and aromatic.',
      'Stir in the rinsed cannellini beans, season with salt and pepper, and simmer for 6-8 minutes.',
      'Fold in fresh spinach leaves until just wilted. Top with grated Parmesan and serve alongside crusty bread.'
    ],
    nutrition: {
      calories: 380,
      protein: 22,
      carbs: 52,
      fat: 10,
      fiber: 14
    },
    youtube_search_query: 'Tuscan White Bean Skillet recipe',
    created_at: new Date('2026-01-02').toISOString()
  },
  {
    id: 'starter-chicken-bowl',
    title: 'Lemon Herb Grilled Chicken Bruschetta Bowl',
    cuisine_type: 'Mediterranean',
    prep_time: '25 mins',
    servings: '2',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
    ingredients: [
      '2 chicken breasts (about 12 oz total)',
      '1 cup cherry tomatoes, diced',
      '1 cup cooked fluffy quinoa or brown rice',
      '1/2 cup fresh mozzarella pearls or diced feta',
      '2 tbsp balsamic glaze reduction',
      '1 tbsp Italian seasoning blend',
      'Fresh basil leaves, torn'
    ],
    instructions: [
      'Season chicken breasts with Italian seasoning, olive oil, salt, and pepper.',
      'Grill or pan-sear chicken over medium-high heat for 6-7 minutes per side until thoroughly cooked (165°F internal).',
      'Let chicken rest for 5 minutes, then slice into strips.',
      'Assemble bowls: base of quinoa, topped with sliced chicken, diced tomatoes, and mozzarella pearls.',
      'Drizzle generously with balsamic glaze and scatter fresh torn basil on top.'
    ],
    nutrition: {
      calories: 490,
      protein: 48,
      carbs: 34,
      fat: 16,
      fiber: 5
    },
    youtube_search_query: 'Chicken Bruschetta Bowl recipe',
    created_at: new Date('2026-01-03').toISOString()
  },
  {
    id: 'starter-pasta',
    title: 'Rustic Garlic Tomato Basil Spaghettini',
    cuisine_type: 'Italian',
    prep_time: '20 mins',
    servings: '2',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    ingredients: [
      '200g spaghettini or fettuccine',
      '1 cup sweet cherry tomatoes, halved',
      '4 cloves garlic, thinly shaved',
      '2 tbsp cold-pressed extra virgin olive oil',
      'Fresh torn sweet basil leaves',
      'Grated Pecorino Romano cheese',
      'Cracked black peppercorns'
    ],
    instructions: [
      'Boil pasta in well-salted water until al dente; reserve 1/2 cup pasta cooking water.',
      'Gently shimmer shaved garlic in olive oil over low heat until golden and sweet.',
      'Add cherry tomatoes; cook until bursting and glossy.',
      'Toss drained pasta with tomatoes, reserved pasta water, fresh basil, and Pecorino.'
    ],
    nutrition: {
      calories: 440,
      protein: 16,
      carbs: 68,
      fat: 12,
      fiber: 6
    },
    youtube_search_query: 'Garlic Tomato Basil Pasta recipe',
    created_at: new Date('2026-01-04').toISOString()
  }
];
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

      let localRecipes = getLocal('recipes', null);
      if (!Array.isArray(localRecipes) || localRecipes.length === 0) {
        localRecipes = DEFAULT_RECIPES;
        setLocal('recipes', DEFAULT_RECIPES);
      }
      
      // Combine remote cloud recipes + local recipes and deduplicate by ID or Title
      const map = new Map();
      [...remoteRecipes, ...localRecipes].forEach(r => {
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
      [...remoteLogs, ...localLogs].forEach(l => {
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
      if (isSupabaseConfigured && supabase && userId) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
          if (!error && data) return data;
        } catch (e) {}
      }
      return getLocal('user_preferences', DEFAULT_PREFERENCES);
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
      [...remoteScans, ...localScans].forEach(s => {
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
    },

    async clear() {
      setLocal('scan_logs', []);
    }
  }
};
