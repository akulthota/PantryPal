import React, { useState, useEffect } from 'react';
import { Search, Trash2, BookOpen, Clock, Users, Utensils, X, AlertTriangle, Youtube, CheckSquare, Bookmark, Compass, Sparkles, RefreshCw, ChefHat } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/supabase';
import { searchRecipes, getRecipeDetails, getRandomRecipes } from '../lib/spoonacular';

export default function RecipesPage({ showToast, initialTab = 'saved' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'saved' | 'browse'

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
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      
      {/* Top Banner Navigation & Tab Switcher */}
      <div className="ledger-card animate-fade-in" style={{ padding: '2.25rem 2rem', marginBottom: '2.5rem', backgroundColor: 'var(--card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--pine)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Kitchen Cookery Ledger
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--ink)' }}>
              Culinary <span className="highlight-gold">Recipe Collection</span>
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', marginTop: '0.35rem' }}>
              Browse 5,000+ real cookbook recipes or view your personal saved pantry dishes.
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div style={{ display: 'flex', backgroundColor: 'var(--paper-deep)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '2px solid var(--ink)' }}>
            <button
              onClick={() => setActiveTab('saved')}
              className={`btn btn-sm ${activeTab === 'saved' ? 'btn-gold' : 'btn-outline'}`}
              style={{ border: activeTab === 'saved' ? '2px solid var(--ink)' : '2px solid transparent', boxShadow: activeTab === 'saved' ? '2px 2px 0px var(--ink)' : 'none' }}
            >
              <Bookmark size={17} /> My Saved Recipes ({savedRecipes.length})
            </button>

            <button
              onClick={() => setActiveTab('browse')}
              className={`btn btn-sm ${activeTab === 'browse' ? 'btn-gold' : 'btn-outline'}`}
              style={{ border: activeTab === 'browse' ? '2px solid var(--ink)' : '2px solid transparent', boxShadow: activeTab === 'browse' ? '2px 2px 0px var(--ink)' : 'none' }}
            >
              <Compass size={17} /> Explore Online Recipes
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BROWSE REAL SPOONACULAR RECIPES */}
      {activeTab === 'browse' && (
        <div>
          {/* Pinned Search & Filter Memo (Sticky Note Style for Listing/Search) */}
          <div className="sticky-note sticky-note-parchment" style={{ marginBottom: '2.5rem' }}>
            <div className="sticky-pin sticky-pin-gold"></div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '2.6rem', backgroundColor: '#FFFFFF' }}
                  placeholder="Search 5,000+ recipes by dish name, ingredient, or keyword (e.g. Pasta, Salmon, Curry)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                <Search size={18} /> Search Recipes
              </button>
            </form>

            {/* Cuisine Filter Tags */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ink)', marginRight: '0.5rem', textTransform: 'uppercase' }}>
                Filter Cuisines:
              </span>
              {CUISINES.map(c => {
                const selected = selectedCuisine === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCuisineSelect(c)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      border: '1.5px solid var(--ink)',
                      fontSize: '0.825rem',
                      fontWeight: selected ? 800 : 600,
                      cursor: 'pointer',
                      backgroundColor: selected ? 'var(--gold)' : 'var(--card)',
                      color: 'var(--ink)',
                      boxShadow: selected ? '2px 2px 0px var(--ink)' : 'none',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipes Grid (Editorial Ledger Cards — NOT Sticky Notes) */}
          {isBrowseLoading && browseRecipesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--pine)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--ink)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Fetching recipes from cookbook archive...</p>
            </div>
          ) : browseRecipesList.length > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
                {browseRecipesList.map((recipe) => {
                  const readyIn = recipe.readyInMinutes || 30;
                  const difficulty = readyIn <= 20 ? 'Easy' : readyIn <= 45 ? 'Intermediate' : 'Advanced';
                  return (
                    <div
                      key={recipe.id}
                      className="ledger-card"
                      style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--card)' }}
                    >
                      {/* Image Thumbnail with thick border */}
                      <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden', backgroundColor: 'var(--paper-deep)', borderBottom: '2px solid var(--ink)' }}>
                        <img
                          src={recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                          alt={recipe.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div
                          className="mono"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            border: '1.5px solid var(--ink)',
                            boxShadow: '2px 2px 0px var(--ink)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}
                        >
                          {difficulty}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.75rem', lineHeight: 1.3, fontFamily: 'var(--font-serif)' }}>
                            {recipe.title}
                          </h3>

                          <div style={{ display: 'flex', gap: '0.85rem', color: 'var(--ink-soft)', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                            <div className="tag-badge">
                              <Clock size={14} color="var(--rust)" /> {readyIn} mins
                            </div>
                            <div className="tag-badge">
                              <Users size={14} color="var(--sage)" /> {recipe.servings || 2} servings
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openRecipeDetailModal(recipe)}
                          className="btn btn-outline"
                          style={{ width: '100%', justifyContent: 'center' }}
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
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={isBrowseLoading}
                    className="btn btn-gold btn-lg"
                  >
                    {isBrowseLoading ? 'Loading more recipes...' : 'Load More Recipes ↓'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ledger-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--card)' }}>
              <ChefHat size={48} style={{ color: 'var(--ink-faint)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                No recipes found
              </h3>
              <p style={{ color: 'var(--ink-soft)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
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
          {/* Search Saved Recipes Bar (Pinned Search Memo) */}
          <div className="sticky-note sticky-note-parchment" style={{ marginBottom: '2.5rem' }}>
            <div className="sticky-pin sticky-pin-gold"></div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '2.6rem', backgroundColor: '#FFFFFF' }}
                  placeholder="Filter saved recipes by dish name, cuisine, or ingredient..."
                  value={savedSearchTerm}
                  onChange={(e) => setSavedSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                  Cuisine:
                </span>
                {savedCuisinesList.map(c => {
                  const selected = savedSelectedCuisine === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSavedSelectedCuisine(c)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        border: '1.5px solid var(--ink)',
                        fontSize: '0.825rem',
                        fontWeight: selected ? 800 : 600,
                        cursor: 'pointer',
                        backgroundColor: selected ? 'var(--gold)' : 'var(--card)',
                        color: 'var(--ink)',
                        boxShadow: selected ? '2px 2px 0px var(--ink)' : 'none',
                        transition: 'all 0.1s ease'
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
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--pine)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--ink)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Loading your saved recipes...</p>
            </div>
          ) : filteredSavedRecipes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
              {filteredSavedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="ledger-card"
                  style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--card)' }}
                >
                  {/* Optional Image Thumbnail Header */}
                  {recipe.image && (
                    <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden', backgroundColor: 'var(--paper-deep)', borderBottom: '2px solid var(--ink)' }}>
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      {recipe.cuisine_type && (
                        <div
                          className="mono"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            border: '1.5px solid var(--ink)',
                            boxShadow: '2px 2px 0px var(--ink)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}
                        >
                          {recipe.cuisine_type}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.3, fontFamily: 'var(--font-serif)' }}>
                          {recipe.title}
                        </h3>
                        <button
                          onClick={() => setDeletingRecipeId(recipe.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', padding: '4px' }}
                          title="Delete recipe"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {!recipe.image && recipe.cuisine_type && (
                        <span className="tag-badge" style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--ink)', marginBottom: '1rem', display: 'inline-block' }}>
                          {recipe.cuisine_type} Style
                        </span>
                      )}

                      <div style={{ display: 'flex', gap: '0.85rem', color: 'var(--ink-soft)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                        {recipe.prep_time && (
                          <div className="tag-badge">
                            <Clock size={14} color="var(--rust)" /> {recipe.prep_time}
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="tag-badge">
                            <Users size={14} color="var(--sage)" /> {recipe.servings} Servings
                          </div>
                        )}
                      </div>

                      <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        <strong style={{ color: 'var(--ink)' }}>Ingredients:</strong> {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : ''}
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
                </div>
              ))}
            </div>
          ) : (
            <div className="ledger-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--card)' }}>
              <Utensils size={48} style={{ color: 'var(--ink-faint)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--ink)' }}>
                No saved recipes found
              </h3>
              <p style={{ color: 'var(--ink-soft)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Browse recipes or scan your pantry to save dishes to your personal kitchen collection!
              </p>
            </div>
          )}
        </div>
      )}

      {/* RECIPE DETAIL MODAL VIEW (EDITORIAL LEDGER STYLE — NOT A STICKY NOTE) */}
      {activeDetailRecipe && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(20, 32, 21, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
          onClick={() => setActiveDetailRecipe(null)}
        >
          <div
            className="animate-scale-in"
            style={{
              maxWidth: '780px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2.5rem',
              position: 'relative',
              backgroundColor: 'var(--card)',
              border: 'var(--border-thicker)',
              boxShadow: 'var(--shadow-hard-xl)',
              borderRadius: 'var(--radius-md)'
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
                backgroundColor: 'var(--paper)',
                border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0px var(--ink)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--ink)'
              }}
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Title & Image */}
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, marginBottom: '1rem', color: 'var(--ink)', paddingRight: '2rem', fontFamily: 'var(--font-serif)' }}>
              {activeDetailRecipe.title}
            </h2>

            {activeDetailRecipe.image && (
              <img
                src={activeDetailRecipe.image}
                alt={activeDetailRecipe.title}
                style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '2px solid var(--ink)', boxShadow: 'var(--shadow-hard)' }}
              />
            )}

            {/* Badges Bar */}
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--ink)', marginBottom: '1.75rem', fontSize: '0.95rem', fontWeight: 700, flexWrap: 'wrap' }}>
              <div className="tag-badge">
                <Clock size={16} color="var(--rust)" />
                Prep Time: {activeDetailRecipe.readyInMinutes ? `${activeDetailRecipe.readyInMinutes} mins` : activeDetailRecipe.prep_time || '30 mins'}
              </div>
              <div className="tag-badge">
                <Users size={16} color="var(--sage)" />
                Servings: {activeDetailRecipe.servings || 2}
              </div>
              <div className="tag-badge" style={{ backgroundColor: 'var(--paper-deep)' }}>
                Difficulty:{' '}
                {activeDetailRecipe.readyInMinutes
                  ? (activeDetailRecipe.readyInMinutes <= 20 ? 'Easy' : activeDetailRecipe.readyInMinutes <= 45 ? 'Intermediate' : 'Advanced')
                  : (activeDetailRecipe.difficulty || 'Easy')}
              </div>
            </div>

            {/* Ingredients Section (Structured Checklist Ledger) */}
            <div style={{ backgroundColor: 'var(--paper)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--sage)' }}>✓</span> Ingredients Required
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--ink)', fontWeight: 600 }}>
                {Array.isArray(activeDetailRecipe.extendedIngredients) ? (
                  activeDetailRecipe.extendedIngredients.map((ing, i) => {
                    const amount = ing.measures?.metric?.amount ? Math.round(ing.measures.metric.amount * 100) / 100 : ing.amount || '';
                    const unit = ing.measures?.metric?.unitShort || ing.unit || '';
                    const name = ing.name || ing.originalName || '';
                    return (
                      <li key={i} style={{ borderBottom: '1px dashed rgba(20, 32, 21, 0.15)', paddingBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--gold-dark)' }}>•</span>
                        <span>{`${amount} ${unit} ${name}`.trim()}</span>
                      </li>
                    );
                  })
                ) : Array.isArray(activeDetailRecipe.ingredients) ? (
                  activeDetailRecipe.ingredients.map((ing, i) => (
                    <li key={i} style={{ borderBottom: '1px dashed rgba(20, 32, 21, 0.15)', paddingBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--gold-dark)' }}>•</span>
                      <span>{ing}</span>
                    </li>
                  ))
                ) : (
                  <li>Standard recipe ingredients</li>
                )}
              </ul>
            </div>

            {/* Instructions */}
            <div style={{ marginBottom: '1.75rem', backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1rem' }}>
                Preparation Instructions
              </h3>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--ink-soft)', fontWeight: 500 }}>
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
            <div style={{ backgroundColor: 'var(--paper-deep)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', textAlign: 'center', marginBottom: '2rem' }}>
              <div><strong className="mono" style={{ color: 'var(--ink)', fontSize: '1.4rem' }}>{activeDetailRecipe.nutrition?.calories || getNutrientByName(activeDetailRecipe, 'calories') || 400}</strong><br /><span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Calories</span></div>
              <div><strong className="mono" style={{ color: 'var(--rust)', fontSize: '1.4rem' }}>{activeDetailRecipe.nutrition?.protein || getNutrientByName(activeDetailRecipe, 'protein') || 25}g</strong><br /><span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Protein</span></div>
              <div><strong className="mono" style={{ color: 'var(--gold-dark)', fontSize: '1.4rem' }}>{activeDetailRecipe.nutrition?.carbs || getNutrientByName(activeDetailRecipe, 'carbohydrates') || 45}g</strong><br /><span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Carbs</span></div>
              <div><strong className="mono" style={{ color: 'var(--sage)', fontSize: '1.4rem' }}>{activeDetailRecipe.nutrition?.fat || getNutrientByName(activeDetailRecipe, 'fat') || 14}g</strong><br /><span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Fat</span></div>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.5rem', borderTop: '2px solid var(--ink)' }}>
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
                className={`btn ${cookedModalLogged ? 'btn-outline' : 'btn-primary'}`}
              >
                {cookedModalLogged ? (
                  <>
                    <CheckSquare size={18} color="var(--sage)" /> Meal Logged to Nutrition Tracker!
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
              >
                <Youtube size={18} color="#FF0000" /> Watch on YouTube 🎬
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Saved Recipes */}
      {deletingRecipeId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 32, 21, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="animate-scale-in" style={{ padding: '2.5rem 2rem', maxWidth: '440px', width: '100%', textAlign: 'center', backgroundColor: 'var(--card)', border: 'var(--border-thicker)', boxShadow: 'var(--shadow-hard-xl)', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={42} style={{ color: 'var(--rust)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--ink)', fontFamily: 'var(--font-serif)' }}>Delete Recipe?</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>Are you sure you want to remove this recipe from your collection?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setDeletingRecipeId(null)} className="btn btn-outline">Cancel</button>
              <button onClick={() => handleDeleteSavedRecipe(deletingRecipeId)} className="btn btn-rust">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
