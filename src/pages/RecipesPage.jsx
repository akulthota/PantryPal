import React, { useState, useEffect } from 'react';
import { Search, Trash2, BookOpen, Clock, Users, Utensils, X, AlertTriangle, Youtube, CheckSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/supabase';

export default function RecipesPage({ showToast }) {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [activeModalRecipe, setActiveModalRecipe] = useState(null);
  const [deletingRecipeId, setDeletingRecipeId] = useState(null);
  const [cookedModalLogged, setCookedModalLogged] = useState(false);

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

  const handleLogModalCookedDish = async () => {
    if (!activeModalRecipe || cookedModalLogged) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const protein = activeModalRecipe.nutrition?.protein || 25;
      const calories = activeModalRecipe.nutrition?.calories || 350;
      const fiber = activeModalRecipe.nutrition?.fiber || 0;

      await db.proteinLogs.create({
        item: activeModalRecipe.title,
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
      
      {/* Page Header & Search Bar (High Contrast Light Palette) */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1.25rem' }}>
          My Saved <span className="text-coral">Recipes</span> ({recipes.length})
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search recipes by name, cuisine, or ingredient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Cuisine Filter Pills (High Contrast Light Styling) */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {cuisines.map(c => {
              const selected = selectedCuisine === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '20px',
                    border: selected ? '2px solid var(--coral-primary)' : '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontWeight: selected ? 700 : 500,
                    cursor: 'pointer',
                    backgroundColor: selected ? 'var(--coral-soft)' : '#F8FAFC',
                    color: selected ? 'var(--coral-primary)' : '#334155',
                    transition: 'all 0.2s var(--ease-spring)',
                    boxShadow: selected ? '0 2px 8px rgba(255, 82, 82, 0.15)' : 'none'
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: 'var(--coral-primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-body)' }}>Loading saved recipes...</p>
        </div>
      ) : filteredRecipes.length > 0 ? (
        /* Recipes Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredRecipes.map((recipe) => (
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
                  setActiveModalRecipe(recipe);
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
        /* Empty State */
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
          <Utensils size={48} style={{ color: '#94A3B8', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
            No saved recipes found
          </h3>
          <p style={{ color: 'var(--text-body)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {searchTerm ? 'No recipes match your search query.' : 'Start scanning your fridge or pantry to generate and save delicious recipes!'}
          </p>
        </div>
      )}

      {/* Recipe Details Modal (High Contrast Crisp Light Theme) */}
      {activeModalRecipe && (
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
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveModalRecipe(null)}
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

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
              {activeModalRecipe.title}
            </h2>

            {activeModalRecipe.cuisine_type && (
              <span style={{ backgroundColor: 'var(--coral-soft)', color: 'var(--coral-primary)', border: '1px solid var(--coral-border)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-block', marginBottom: '1.5rem' }}>
                {activeModalRecipe.cuisine_type}
              </span>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-body)', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
              <div><strong style={{ color: 'var(--text-heading)' }}>Prep Time:</strong> {activeModalRecipe.prep_time || '15-20 mins'}</div>
              <div><strong style={{ color: 'var(--text-heading)' }}>Servings:</strong> {activeModalRecipe.servings || '2-4'}</div>
              <div><strong style={{ color: 'var(--text-heading)' }}>Difficulty:</strong> {activeModalRecipe.difficulty || 'Easy'}</div>
            </div>

            {/* Ingredients (Fresh Light Mint Container) */}
            <div style={{ backgroundColor: 'var(--sage-soft)', padding: '1.25rem 1.5rem', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid var(--sage-border)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--sage-green)', marginBottom: '0.75rem' }}>
                Ingredients Required
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-heading)', fontWeight: 600 }}>
                {Array.isArray(activeModalRecipe.ingredients) && activeModalRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--honey-amber)', marginBottom: '0.75rem' }}>
                Preparation Instructions
              </h3>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-body)', fontWeight: 500 }}>
                {Array.isArray(activeModalRecipe.instructions) && activeModalRecipe.instructions.map((step, i) => (
                  <li key={i} style={{ lineHeight: 1.6 }}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Nutrition Info Bar */}
            {activeModalRecipe.nutrition && (
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: '1.75rem' }}>
                <div><strong style={{ color: 'var(--text-heading)', fontSize: '1.2rem' }}>{activeModalRecipe.nutrition.calories || 0}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Calories</span></div>
                <div><strong style={{ color: 'var(--coral-primary)', fontSize: '1.2rem' }}>{activeModalRecipe.nutrition.protein || 0}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Protein</span></div>
                <div><strong style={{ color: 'var(--honey-amber)', fontSize: '1.2rem' }}>{activeModalRecipe.nutrition.carbs || 0}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Carbs</span></div>
                <div><strong style={{ color: 'var(--sage-green)', fontSize: '1.2rem' }}>{activeModalRecipe.nutrition.fat || 0}g</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fat</span></div>
              </div>
            )}

            {/* Cooked Dish & YouTube Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={handleLogModalCookedDish}
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

              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeModalRecipe.title + ' recipe tutorial')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ borderColor: '#FF0000', color: '#CC0000', backgroundColor: '#FFF5F5', textDecoration: 'none' }}
              >
                <Youtube size={18} style={{ color: '#FF0000' }} /> YouTube Tutorial
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecipeId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="glass-card animate-scale-in" style={{ padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px solid var(--coral-border)' }}>
            <AlertTriangle size={40} style={{ color: 'var(--coral-primary)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>Delete Recipe?</h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Are you sure you want to remove this recipe from your collection?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setDeletingRecipeId(null)} className="btn btn-outline">Cancel</button>
              <button onClick={() => handleDelete(deletingRecipeId)} className="btn btn-primary">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
