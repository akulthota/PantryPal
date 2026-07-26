import React, { useState, useEffect } from 'react';
import { Search, Trash2, BookOpen, Clock, Users, Utensils, X, AlertTriangle } from 'lucide-react';
import { db } from '../lib/supabase';

export default function RecipesPage({ showToast }) {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [activeModalRecipe, setActiveModalRecipe] = useState(null);
  const [deletingRecipeId, setDeletingRecipeId] = useState(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const data = await db.recipes.list();
      setRecipes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await db.recipes.delete(id);
      setRecipes(recipes.filter(r => r.id !== id));
      setDeletingRecipeId(null);
      if (activeModalRecipe?.id === id) setActiveModalRecipe(null);
      showToast('Deleted', 'Recipe removed from your collection.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to delete recipe.', 'error');
    }
  };

  const cuisines = ['All', ...new Set(recipes.map(r => r.cuisine_type).filter(Boolean))];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.cuisine_type && r.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.ingredients && r.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCuisine = selectedCuisine === 'All' || r.cuisine_type === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      
      {/* Page Header & Search Bar */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1.25rem' }}>
          My Saved <span className="gradient-text-magma">Recipes</span>
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--periwinkle-glow)' }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search recipes by name, cuisine, or ingredient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {cuisines.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(c)}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '20px',
                  border: selectedCuisine === c ? '1px solid var(--magma-red)' : '1px solid var(--border-glass)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedCuisine === c ? 'rgba(242, 119, 119, 0.2)' : 'rgba(12, 13, 56, 0.6)',
                  color: selectedCuisine === c ? '#FFFFFF' : 'var(--text-body)',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedCuisine === c ? '0 0 10px rgba(242, 119, 119, 0.3)' : 'none'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border-glass)', borderTopColor: 'var(--magma-red)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-body)' }}>Loading saved recipes...</p>
        </div>
      ) : filteredRecipes.length > 0 ? (
        /* Recipes Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="glass-card feature-card-hover"
              style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                    {recipe.title}
                  </h3>
                  <button
                    onClick={() => setDeletingRecipeId(recipe.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', padding: '4px' }}
                    title="Delete recipe"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {recipe.cuisine_type && (
                  <span style={{ display: 'inline-block', backgroundColor: 'rgba(242, 119, 119, 0.15)', color: 'var(--magma-red)', border: '1px solid rgba(242, 119, 119, 0.3)', padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                    {recipe.cuisine_type}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {recipe.prep_time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} style={{ color: 'var(--cyan-glow)' }} /> {recipe.prep_time}
                    </div>
                  )}
                  {recipe.servings && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} style={{ color: 'var(--cyan-glow)' }} /> {recipe.servings} servings
                    </div>
                  )}
                </div>

                <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  <strong style={{ color: '#FFFFFF' }}>Ingredients:</strong> {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : ''}
                </p>
              </div>

              <button
                onClick={() => setActiveModalRecipe(recipe)}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <BookOpen size={16} /> View Recipe Details
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Utensils size={48} style={{ color: 'var(--periwinkle-glow)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFFFFF' }}>
            No saved recipes found
          </h3>
          <p style={{ color: 'var(--text-body)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {searchTerm ? 'No recipes match your search query.' : 'Start scanning your fridge or pantry to generate and save delicious recipes!'}
          </p>
        </div>
      )}

      {/* Recipe Details Modal */}
      {activeModalRecipe && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(12, 13, 56, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
          onClick={() => setActiveModalRecipe(null)}
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
              border: '1px solid var(--cyan-glow)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalRecipe(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-body)' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFFFFF' }}>
              {activeModalRecipe.title}
            </h2>

            {activeModalRecipe.cuisine_type && (
              <span style={{ backgroundColor: 'var(--magma-red)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', marginBottom: '1.5rem' }}>
                {activeModalRecipe.cuisine_type}
              </span>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-body)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <div><strong>Prep Time:</strong> {activeModalRecipe.prep_time || '15-20 mins'}</div>
              <div><strong>Servings:</strong> {activeModalRecipe.servings || '2-4'}</div>
              <div><strong>Difficulty:</strong> {activeModalRecipe.difficulty || 'Easy'}</div>
            </div>

            {/* Ingredients */}
            <div style={{ backgroundColor: 'rgba(12, 13, 56, 0.6)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyan-glow)', marginBottom: '0.75rem' }}>
                Ingredients
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#FFFFFF' }}>
                {Array.isArray(activeModalRecipe.ingredients) && activeModalRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--lava-amber)', marginBottom: '0.75rem' }}>
                Instructions
              </h3>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text-body)' }}>
                {Array.isArray(activeModalRecipe.instructions) && activeModalRecipe.instructions.map((step, i) => (
                  <li key={i} style={{ lineHeight: 1.6 }}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Nutrition */}
            {activeModalRecipe.nutrition && (
              <div style={{ backgroundColor: 'rgba(12, 13, 56, 0.8)', border: '1px solid var(--border-glass)', padding: '1rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div><strong style={{ color: '#FFFFFF' }}>{activeModalRecipe.nutrition.calories || 0}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Calories</span></div>
                <div><strong style={{ color: 'var(--magma-red)' }}>{activeModalRecipe.nutrition.protein || 0}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Protein</span></div>
                <div><strong style={{ color: 'var(--lava-amber)' }}>{activeModalRecipe.nutrition.carbs || 0}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Carbs</span></div>
                <div><strong style={{ color: 'var(--sulphur-gold)' }}>{activeModalRecipe.nutrition.fat || 0}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Fat</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecipeId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12, 13, 56, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="glass-card animate-scale-in" style={{ padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center', border: '1px solid var(--magma-red)' }}>
            <AlertTriangle size={40} style={{ color: 'var(--magma-red)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFFFFF' }}>Delete Recipe?</h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Are you sure you want to remove this recipe from your collection?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setDeletingRecipeId(null)} className="btn btn-outline">Cancel</button>
              <button onClick={() => handleDelete(deletingRecipeId)} className="btn" style={{ backgroundColor: 'var(--magma-red)', color: 'white' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
