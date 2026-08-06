import React, { useState, useEffect } from 'react';
import { Search, Trash2, BookOpen, Clock, Users, Utensils, X, AlertTriangle, Youtube, CheckSquare, Bookmark, Compass, Sparkles, RefreshCw, ChefHat } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/supabase';
import { searchRecipes, getRecipeDetails, getRandomRecipes } from '../lib/spoonacular';

export default function RecipesPage({ showToast }) {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'saved'

  // Tab 1: Browse Recipes State
  const [browseRecipesList, setBrowseRecipesList] = useState([]);
  const [isBrowseLoading, setIsBrowseLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Detail Modal State
  const [activeDetailRecipe, setActiveDetailRecipe] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSavingBrowseRecipe, setIsSavingBrowseRecipe] = useState(false);

  // Tab 2: Saved Recipes State
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [isSavedLoading, setIsSavedLoading] = useState(true);
  const [savedSearchTerm, setSavedSearchTerm] = useState('');
  const [savedSelectedCuisine, setSavedSelectedCuisine] = useState('All');
  const [deletingRecipeId, setDeletingRecipeId] = useState(null);
  const [cookedModalLogged, setCookedModalLogged] = useState(false);

  const CUISINES = [
    'All', 'Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Mediterranean',
    'American', 'French', 'Japanese', 'Korean', 'Middle Eastern', 'Greek', 'Spanish', 'Vietnamese'
  ];

  useEffect(() => {
    if (activeTab === 'browse' && browseRecipesList.length === 0) {
      fetchInitialBrowseRecipes();
    } else if (activeTab === 'saved') {
      loadSavedRecipes();
    }
  }, [activeTab]);

  const fetchInitialBrowseRecipes = async () => {
    setIsBrowseLoading(true);
    try {
      const data = await getRandomRecipes(12);
      setBrowseRecipesList(data || []);
      setOffset(0);
      setHasMore(data.length >= 12);
    } catch (err) {
      console.warn('Error fetching random recipes:', err);
      showToast('Notice', 'Recipe database temporarily unavailable.', 'info');
    } finally {
      setIsBrowseLoading(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsBrowseLoading(true);
    setOffset(0);
    try {
      const data = await searchRecipes({ query: searchQuery, cuisine: selectedCuisine, number: 12, offset: 0 });
      const results = data.results || data.recipes || [];
      setBrowseRecipesList(results);
      setHasMore(results.length >= 12);
    } catch (err) {
      showToast('Error', 'Failed to search recipes.', 'error');
    } finally {
      setIsBrowseLoading(false);
    }
  };

  const handleCuisineSelect = async (cuisine) => {
    setSelectedCuisine(cuisine);
    setIsBrowseLoading(true);
    setOffset(0);
    try {
      const data = await searchRecipes({ query: searchQuery, cuisine: cuisine, number: 12, offset: 0 });
      const results = data.results || data.recipes || [];
      setBrowseRecipesList(results);
      setHasMore(results.length >= 12);
    } catch (err) {
      showToast('Error', 'Failed to filter by cuisine.', 'error');
    } finally {
      setIsBrowseLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const nextOffset = offset + 12;
    setIsBrowseLoading(true);
    try {
      const data = await searchRecipes({ query: searchQuery, cuisine: selectedCuisine, number: 12, offset: nextOffset });
      const newResults = data.results || data.recipes || [];
      if (newResults.length > 0) {
        setBrowseRecipesList(prev => [...prev, ...newResults]);
        setOffset(nextOffset);
        setHasMore(newResults.length >= 12);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      showToast('Error', 'Failed to load more recipes.', 'error');
    } finally {
      setIsBrowseLoading(false);
    }
  };

  const openRecipeDetailModal = async (recipeSummary) => {
    setIsDetailLoading(true);
    setActiveDetailRecipe(recipeSummary);
    setCookedModalLogged(false);

    try {
      if (!recipeSummary.extendedIngredients || !recipeSummary.analyzedInstructions) {
        const fullDetails = await getRecipeDetails(recipeSummary.id);
        if (fullDetails) {
          setActiveDetailRecipe(fullDetails);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch full recipe details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSaveBrowseRecipe = async (recipe) => {
    if (!recipe) return;
    setIsSavingBrowseRecipe(true);
    try {
      // Map Spoonacular recipe to app's standardized recipe format
      const formattedIngredients = Array.isArray(recipe.extendedIngredients)
        ? recipe.extendedIngredients.map(ing => {
            const amount = ing.measures?.metric?.amount || ing.amount || '';
            const unit = ing.measures?.metric?.unitShort || ing.unit || '';
            const name = ing.name || ing.originalName || '';
            return `${amount} ${unit} ${name}`.trim();
          })
        : [];

      const formattedInstructions = Array.isArray(recipe.analyzedInstructions?.[0]?.steps)
        ? recipe.analyzedInstructions[0].steps.map(s => s.step)
        : (recipe.instructions ? [recipe.instructions] : ['Follow standard preparation instructions.']);

      const nutrients = recipe.nutrition?.nutrients || [];
      const getNutrient = (name) => {
        const n = nutrients.find(x => x.name.toLowerCase() === name.toLowerCase());
        return n ? Math.round(n.amount) : 0;
      };

      const recipeToSave = {
        title: recipe.title,
        cuisine_type: recipe.cuisines?.[0] || selectedCuisine !== 'All' ? selectedCuisine : 'Global',
        prep_time: recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : '30 mins',
        servings: recipe.servings ? String(recipe.servings) : '2',
        difficulty: recipe.readyInMinutes ? (recipe.readyInMinutes <= 20 ? 'Easy' : recipe.readyInMinutes <= 45 ? 'Intermediate' : 'Advanced') : 'Easy',
        ingredients: formattedIngredients,
        instructions: formattedInstructions,
        nutrition: {
          calories: getNutrient('calories') || 400,
          protein: getNutrient('protein') || 25,
          carbs: getNutrient('carbohydrates') || 45,
          fat: getNutrient('fat') || 14,
          fiber: getNutrient('fiber') || 6
        },
        youtube_search_query: `${recipe.title} recipe`
      };

      await db.recipes.create(recipeToSave);
      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch {}
      showToast('Recipe Saved! 📌', `"${recipe.title}" added to your collection!`, 'success');
      loadSavedRecipes();
    } catch (err) {
      showToast('Error', 'Failed to save recipe.', 'error');
    } finally {
      setIsSavingBrowseRecipe(false);
    }
  };

  // Tab 2 Saved Recipe Functions
  const loadSavedRecipes = async () => {
    setIsSavedLoading(true);
    try {
      const data = await db.recipes.list();
      setSavedRecipes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavedLoading(false);
    }
  };

  const handleDeleteSavedRecipe = async (id) => {
    try {
      await db.recipes.delete(id);
      setSavedRecipes(savedRecipes.filter(r => r.id !== id));
      setDeletingRecipeId(null);
      if (activeDetailRecipe?.id === id) setActiveDetailRecipe(null);
      showToast('Deleted', 'Recipe removed from your collection.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to delete recipe.', 'error');
    }
  };

  const handleLogModalCookedDish = async (recipe) => {
    if (!recipe || cookedModalLogged) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const protein = recipe.nutrition?.protein || getNutrientByName(recipe, 'protein') || 25;
      const calories = recipe.nutrition?.calories || getNutrientByName(recipe, 'calories') || 350;
      const fiber = recipe.nutrition?.fiber || getNutrientByName(recipe, 'fiber') || 0;

      await db.proteinLogs.create({
        item: recipe.title,
        total_protein: protein,
        animal_protein: Math.round(protein * 0.6),
        plant_protein: Math.round(protein * 0.4),
        dairy_protein: 0,
        total_calories: calories,
        total_fiber: fiber,
        logged_date: todayStr
      });

      try { confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } }); } catch {}
      setCookedModalLogged(true);
      showToast('Meal Logged! 🍳', `Added +${protein}g protein to today's tracker!`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to log cooked meal.', 'error');
    }
  };

  const getNutrientByName = (recipe, name) => {
    if (recipe.nutrition?.nutrients) {
      const n = recipe.nutrition.nutrients.find(x => x.name.toLowerCase() === name.toLowerCase());
      return n ? Math.round(n.amount) : 0;
    }
    return 0;
  };

  const savedCuisinesList = ['All', ...new Set(savedRecipes.map(r => r.cuisine_type).filter(Boolean))];

  const filteredSavedRecipes = savedRecipes.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(savedSearchTerm.toLowerCase()) ||
      (r.cuisine_type && r.cuisine_type.toLowerCase().includes(savedSearchTerm.toLowerCase())) ||
      (r.ingredients && r.ingredients.some(ing => ing.toLowerCase().includes(savedSearchTerm.toLowerCase())));

    const matchesCuisine = savedSelectedCuisine === 'All' || r.cuisine_type === savedSelectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <div style={{ maxWidth: '1250px', margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      
      {/* Top Banner Navigation & Tab Switcher */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
              Culinary <span className="text-coral">Recipe Explorer</span>
            </h1>
            <p style={{ color: 'var(--text-body)', fontSize: '0.975rem' }}>
              Browse 5,000+ real cookbook recipes or view your personal saved recipes collection.
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setActiveTab('browse')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.35rem',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.925rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'browse' ? 'var(--coral-primary)' : 'transparent',
                color: activeTab === 'browse' ? '#FFFFFF' : '#475569',
                boxShadow: activeTab === 'browse' ? 'var(--shadow-button)' : 'none',
                transition: 'all 0.2s var(--ease-spring)'
              }}
            >
              <Compass size={18} /> Browse Recipes
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.35rem',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.925rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'saved' ? 'var(--coral-primary)' : 'transparent',
                color: activeTab === 'saved' ? '#FFFFFF' : '#475569',
                boxShadow: activeTab === 'saved' ? 'var(--shadow-button)' : 'none',
                transition: 'all 0.2s var(--ease-spring)'
              }}
            >
              <Bookmark size={18} /> My Saved Recipes ({savedRecipes.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BROWSE REAL SPOONACULAR RECIPES */}
      {activeTab === 'browse' && (
        <div>
          {/* Search Bar & Cuisine Pills */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search 5,000+ recipes by dish name, ingredient, or keyword (e.g. Pasta, Salmon, Curry)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
                <Search size={18} /> Search
              </button>
            </form>

            {/* Cuisine Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)', marginRight: '0.25rem' }}>Cuisines:</span>
              {CUISINES.map(c => {
                const selected = selectedCuisine === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCuisineSelect(c)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '20px',
                      border: selected ? '2px solid var(--coral-primary)' : '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: selected ? 700 : 500,
                      cursor: 'pointer',
                      backgroundColor: selected ? 'var(--coral-soft)' : '#F8FAFC',
                      color: selected ? 'var(--coral-primary)' : '#334155',
                      transition: 'all 0.2s var(--ease-spring)'
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipes Grid */}
          {isBrowseLoading && browseRecipesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: 'var(--coral-primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-body)', fontWeight: 600 }}>Fetching real recipes from culinary database...</p>
            </div>
          ) : browseRecipesList.length > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {browseRecipesList.map((recipe) => {
                  const readyIn = recipe.readyInMinutes || 30;
                  const difficulty = readyIn <= 20 ? 'Easy' : readyIn <= 45 ? 'Intermediate' : 'Advanced';
                  return (
                    <div
                      key={recipe.id}
                      className="glass-card feature-card-hover"
                      style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    >
                      {/* Image Thumbnail */}
                      <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                        <img
                          src={recipe.image || 'https://spoonacular.com/recipeImages/716429-556x370.jpg'}
                          alt={recipe.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'; }}
                        />
                        <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(17, 24, 39, 0.75)', backdropFilter: 'blur(4px)', color: '#FFFFFF', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {difficulty}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                            {recipe.title}
                          </h3>

                          <div style={{ display: 'flex', gap: '0.85rem', color: 'var(--text-body)', fontSize: '0.85rem', marginBottom: '0.85rem', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} style={{ color: 'var(--coral-primary)' }} /> {readyIn} mins
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={14} style={{ color: 'var(--coral-primary)' }} /> {recipe.servings || 2} servings
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openRecipeDetailModal(recipe)}
                          className="btn btn-outline"
                          style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                        >
                          <BookOpen size={16} /> View Recipe Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={isBrowseLoading}
                    className="btn btn-outline"
                    style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', fontWeight: 700 }}
                  >
                    {isBrowseLoading ? 'Loading more recipes...' : 'Load More Recipes'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
              <ChefHat size={48} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                No recipes found
              </h3>
              <p style={{ color: 'var(--text-body)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Try searching for a different keyword or select another cuisine filter.
              </p>
              <button onClick={fetchInitialBrowseRecipes} className="btn btn-primary">
                <RefreshCw size={16} /> Reset Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SAVED RECIPES */}
      {activeTab === 'saved' && (
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search saved recipes by name, cuisine, or ingredient..."
                  value={savedSearchTerm}
                  onChange={(e) => setSavedSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {savedCuisinesList.map(c => {
                  const selected = savedSelectedCuisine === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSavedSelectedCuisine(c)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '20px',
                        border: selected ? '2px solid var(--coral-primary)' : '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                        backgroundColor: selected ? 'var(--coral-soft)' : '#F8FAFC',
                        color: selected ? 'var(--coral-primary)' : '#334155'
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {isSavedLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: 'var(--coral-primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-body)' }}>Loading saved recipes...</p>
            </div>
          ) : filteredSavedRecipes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredSavedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="glass-card feature-card-hover"
                  style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.3 }}>
                        {recipe.title}
                      </h3>
                      <button
                        onClick={() => setDeletingRecipeId(recipe.id)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                        title="Delete recipe"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {recipe.cuisine_type && (
                      <span style={{ display: 'inline-block', backgroundColor: 'var(--coral-soft)', color: 'var(--coral-primary)', border: '1px solid var(--coral-border)', padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                        {recipe.cuisine_type}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
                      {recipe.prep_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} style={{ color: 'var(--coral-primary)' }} /> {recipe.prep_time}
                        </div>
                      )}
                      {recipe.servings && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={14} style={{ color: 'var(--coral-primary)' }} /> {recipe.servings} servings
                        </div>
                      )}
                    </div>

                    <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      <strong style={{ color: 'var(--text-heading)' }}>Ingredients:</strong> {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveDetailRecipe(recipe);
                      setCookedModalLogged(false);
                    }}
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <BookOpen size={16} /> View Recipe Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
              <Utensils size={48} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
                No saved recipes found
              </h3>
              <p style={{ color: 'var(--text-body)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Browse real recipes or scan your pantry to save recipes to your personal collection!
              </p>
            </div>
          )}
        </div>
      )}

      {/* RECIPE DETAIL MODAL VIEW */}
      {activeDetailRecipe && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.65)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
          onClick={() => setActiveDetailRecipe(null)}
        >
          <div
            className="glass-card animate-scale-in"
            style={{
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2.5rem',
              position: 'relative',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveDetailRecipe(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Title & Image */}
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-heading)', paddingRight: '2rem' }}>
              {activeDetailRecipe.title}
            </h2>

            {activeDetailRecipe.image && (
              <img
                src={activeDetailRecipe.image}
                alt={activeDetailRecipe.title}
                style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}
              />
            )}

            {/* Badges Bar */}
            <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-body)', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 600, flexWrap: 'wrap' }}>
              <div><strong style={{ color: 'var(--text-heading)' }}>Prep Time:</strong> {activeDetailRecipe.readyInMinutes ? `${activeDetailRecipe.readyInMinutes} mins` : activeDetailRecipe.prep_time || '30 mins'}</div>
              <div><strong style={{ color: 'var(--text-heading)' }}>Servings:</strong> {activeDetailRecipe.servings || 2}</div>
              <div>
                <strong style={{ color: 'var(--text-heading)' }}>Difficulty:</strong>{' '}
                {activeDetailRecipe.readyInMinutes
                  ? (activeDetailRecipe.readyInMinutes <= 20 ? 'Easy' : activeDetailRecipe.readyInMinutes <= 45 ? 'Intermediate' : 'Advanced')
                  : (activeDetailRecipe.difficulty || 'Easy')}
              </div>
            </div>

            {/* Ingredients Section with Metric Measurements */}
            <div style={{ backgroundColor: 'var(--sage-soft)', padding: '1.25rem 1.5rem', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid var(--sage-border)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--sage-green)', marginBottom: '0.75rem' }}>
                Ingredients Required
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-heading)', fontWeight: 600 }}>
                {Array.isArray(activeDetailRecipe.extendedIngredients) ? (
                  activeDetailRecipe.extendedIngredients.map((ing, i) => {
                    const amount = ing.measures?.metric?.amount ? Math.round(ing.measures.metric.amount * 100) / 100 : ing.amount || '';
                    const unit = ing.measures?.metric?.unitShort || ing.unit || '';
                    const name = ing.name || ing.originalName || '';
                    return <li key={i}>{`${amount} ${unit} ${name}`.trim()}</li>;
                  })
                ) : Array.isArray(activeDetailRecipe.ingredients) ? (
                  activeDetailRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                ) : (
                  <li>Standard recipe ingredients</li>
                )}
              </ul>
            </div>

            {/* Instructions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--honey-amber)', marginBottom: '0.75rem' }}>
                Preparation Instructions
              </h3>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-body)', fontWeight: 500 }}>
                {Array.isArray(activeDetailRecipe.analyzedInstructions?.[0]?.steps) ? (
                  activeDetailRecipe.analyzedInstructions[0].steps.map((s, i) => {
                    const cleanText = typeof s.step === 'string' ? s.step.replace(/^(Step\s*\d+:?\s*|\d+[\.\)]\s*)/i, '').trim() : s.step;
                    return <li key={i} style={{ lineHeight: 1.6 }}>{cleanText}</li>;
                  })
                ) : Array.isArray(activeDetailRecipe.instructions) ? (
                  activeDetailRecipe.instructions.map((step, i) => {
                    const cleanText = typeof step === 'string' ? step.replace(/^(Step\s*\d+:?\s*|\d+[\.\)]\s*)/i, '').trim() : step;
                    return <li key={i} style={{ lineHeight: 1.6 }}>{cleanText}</li>;
                  })
                ) : (
                  <li style={{ lineHeight: 1.6 }}>{activeDetailRecipe.instructions || 'Follow standard preparation steps.'}</li>
                )}
              </ol>
            </div>

            {/* Nutrition Information */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '1.75rem' }}>
              <div><strong style={{ color: 'var(--text-heading)', fontSize: '1.2rem' }}>{activeDetailRecipe.nutrition?.calories || getNutrientByName(activeDetailRecipe, 'calories') || 400}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Calories</span></div>
              <div><strong style={{ color: 'var(--coral-primary)', fontSize: '1.2rem' }}>{activeDetailRecipe.nutrition?.protein || getNutrientByName(activeDetailRecipe, 'protein') || 25}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Protein</span></div>
              <div><strong style={{ color: 'var(--honey-amber)', fontSize: '1.2rem' }}>{activeDetailRecipe.nutrition?.carbs || getNutrientByName(activeDetailRecipe, 'carbohydrates') || 45}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Carbs</span></div>
              <div><strong style={{ color: 'var(--sage-green)', fontSize: '1.2rem' }}>{activeDetailRecipe.nutrition?.fat || getNutrientByName(activeDetailRecipe, 'fat') || 14}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fat</span></div>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
              {/* Save Recipe Button for Spoonacular recipes */}
              {activeDetailRecipe.extendedIngredients && (
                <button
                  onClick={() => handleSaveBrowseRecipe(activeDetailRecipe)}
                  disabled={isSavingBrowseRecipe}
                  className="btn btn-secondary"
                >
                  <Bookmark size={18} /> {isSavingBrowseRecipe ? 'Saving...' : 'Save Recipe'}
                </button>
              )}

              {/* Log Cooked Dish Button */}
              <button
                onClick={() => handleLogModalCookedDish(activeDetailRecipe)}
                disabled={cookedModalLogged}
                className="btn btn-primary"
                style={{
                  backgroundColor: cookedModalLogged ? 'var(--sage-soft)' : 'var(--coral-primary)',
                  border: cookedModalLogged ? '1px solid var(--sage-border)' : 'none',
                  color: cookedModalLogged ? 'var(--sage-green)' : '#FFFFFF'
                }}
              >
                {cookedModalLogged ? (
                  <>
                    <CheckSquare size={18} style={{ color: 'var(--sage-green)' }} /> Meal Logged!
                  </>
                ) : (
                  <>
                    <span>🍳 Did you cook this? Log Nutrition</span>
                  </>
                )}
              </button>

              {/* Watch on YouTube Button */}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeDetailRecipe.title + ' recipe')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ borderColor: '#FF0000', color: '#CC0000', backgroundColor: '#FFF5F5', textDecoration: 'none' }}
              >
                <Youtube size={18} style={{ color: '#FF0000' }} /> Watch on YouTube 🎬
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Saved Recipes */}
      {deletingRecipeId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="glass-card animate-scale-in" style={{ padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px solid var(--coral-border)' }}>
            <AlertTriangle size={40} style={{ color: 'var(--coral-primary)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>Delete Recipe?</h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Are you sure you want to remove this recipe from your collection?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setDeletingRecipeId(null)} className="btn btn-outline">Cancel</button>
              <button onClick={() => handleDeleteSavedRecipe(deletingRecipeId)} className="btn btn-primary">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
