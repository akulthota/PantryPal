import React from 'react';
import { Camera, Utensils, Activity, ArrowRight, Flame, CheckCircle2, ShieldCheck, HeartPulse, Sparkles, Citrus } from 'lucide-react';

export default function HomePage({ onNavigate, stats = {} }) {
  const { recipeCount = 0, todayProtein = 0, proteinGoal = 80 } = stats;

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      
      {/* Hero Welcome Banner with Jubilant Fruity Gradient */}
      <div
        className="animate-fade-in glass-card"
        style={{
          padding: '3.5rem 3rem',
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, #FFF2EE 0%, #FFFBEB 50%, #F0FDF4 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #FFD1D1',
          boxShadow: '0 8px 30px rgba(255, 82, 82, 0.08)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '760px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', color: 'var(--coral-primary)', border: '1px solid var(--coral-border)', padding: '0.4rem 1.1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(255,82,82,0.1)' }}>
            <Sparkles size={16} style={{ color: 'var(--coral-primary)' }} /> Fresh & Smart Kitchen Assistant
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
              color: 'var(--text-heading)'
            }}
          >
            Cook smarter with <span className="text-coral">PantryPal</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-body)', marginBottom: '2.25rem', lineHeight: 1.65 }}>
            Snap a photo of your fridge or pantry to automatically detect ingredients, discover delicious custom recipes tailored to your taste, and track your daily nutrition.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('analyze')}
              className="btn btn-primary"
              style={{ fontSize: '1rem', padding: '0.8rem 1.75rem' }}
            >
              <Camera size={18} /> Scan Pantry Ingredients
            </button>
            <button
              onClick={() => onNavigate('recipes')}
              className="btn btn-outline"
              style={{ fontSize: '1rem', padding: '0.8rem 1.75rem' }}
            >
              <Utensils size={18} /> Saved Recipes ({recipeCount})
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid (Alternating Distinct Fruity Card Themes) */}
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-heading)' }}>
        Kitchen & Health Features
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Fruity Card 1: Strawberry / Watermelon Red Tint */}
        <div
          className="glass-card card-fruit-red"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#FFFFFF', color: 'var(--coral-primary)', border: '1px solid var(--coral-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 12px rgba(255, 82, 82, 0.15)' }}>
              <Camera size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.65rem', color: 'var(--text-heading)' }}>
              Fridge & Pantry Vision Scanner
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Upload or snap a photo of your shelves to identify ingredients and instantly craft step-by-step custom recipes.
            </p>
          </div>
          <button onClick={() => onNavigate('analyze')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Open Pantry Scanner</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Fruity Card 2: Mango / Pineapple Gold Tint */}
        <div
          className="glass-card card-fruit-yellow"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#FFFFFF', color: 'var(--honey-amber)', border: '1px solid var(--honey-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}>
              <Flame size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.65rem', color: 'var(--text-heading)' }}>
              Meal Calorie & Macro Estimator
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Take a photo of any cooked plate or snack to calculate calories, protein, carbs, fat, and log to your daily tracker.
            </p>
          </div>
          <button onClick={() => onNavigate('calories')} className="btn btn-amber" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Scan Meal Calories</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Fruity Card 3: Fresh Kiwi / Green Apple Tint */}
        <div
          className="glass-card card-fruit-green"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#FFFFFF', color: 'var(--sage-green)', border: '1px solid var(--sage-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
              <Utensils size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.65rem', color: 'var(--text-heading)' }}>
              Personalized Saved Recipes
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Save your favorite recipes, view step-by-step instructions, watch YouTube cooking tutorials, and log cooked meals.
            </p>
          </div>
          <button onClick={() => onNavigate('recipes')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Browse Recipes ({recipeCount})</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>

      {/* Daily Summary Bar with Fruity Pastel Tints */}
      <div className="glass-card" style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', textAlign: 'center' }}>
        <div style={{ padding: '1rem', backgroundColor: '#FFF0F0', borderRadius: '14px', border: '1px solid var(--coral-border)' }}>
          <div style={{ color: 'var(--coral-primary)', fontWeight: 800, fontSize: '2.1rem' }}>{recipeCount}</div>
          <div style={{ color: 'var(--text-heading)', fontSize: '0.875rem', fontWeight: 700 }}>Saved Recipes</div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#FFFBEB', borderRadius: '14px', border: '1px solid var(--honey-border)' }}>
          <div style={{ color: 'var(--honey-amber)', fontWeight: 800, fontSize: '2.1rem' }}>{todayProtein}g</div>
          <div style={{ color: 'var(--text-heading)', fontSize: '0.875rem', fontWeight: 700 }}>Today's Protein</div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: '14px', border: '1px solid var(--sage-border)' }}>
          <div style={{ color: 'var(--sage-green)', fontWeight: 800, fontSize: '2.1rem' }}>{proteinGoal}g</div>
          <div style={{ color: 'var(--text-heading)', fontSize: '0.875rem', fontWeight: 700 }}>Daily Goal Target</div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#F5F3FF', borderRadius: '14px', border: '1px solid var(--berry-border)' }}>
          <div style={{ color: 'var(--berry-purple)', fontWeight: 800, fontSize: '2.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle2 size={26} /> Active
          </div>
          <div style={{ color: 'var(--text-heading)', fontSize: '0.875rem', fontWeight: 700 }}>Kitchen Engine</div>
        </div>
      </div>

    </div>
  );
}
