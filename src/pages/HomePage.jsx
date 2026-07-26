import React from 'react';
import { Camera, Utensils, Activity, ArrowRight, Flame, CheckCircle2, ShieldCheck, HeartPulse } from 'lucide-react';

export default function HomePage({ onNavigate, stats = {} }) {
  const { recipeCount = 0, todayProtein = 0, proteinGoal = 80 } = stats;

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      
      {/* Hero Welcome Banner */}
      <div
        className="animate-fade-in glass-card"
        style={{
          padding: '3.5rem 3rem',
          marginBottom: '2.5rem',
          background: 'linear-gradient(145deg, #181A2A 0%, #12131F 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--coral-soft)', color: 'var(--coral-primary)', border: '1px solid rgba(255, 107, 87, 0.25)', padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            <HeartPulse size={16} /> Smart Kitchen & Nutrition Assistant
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.3rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
              color: '#FFFFFF'
            }}
          >
            Cook smarter with <span className="text-coral">PantryPal</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-body)', marginBottom: '2.25rem', lineHeight: 1.65 }}>
            Snap a photo of your fridge or pantry to automatically detect ingredients, discover custom recipes tailored to your dietary preferences, and track your daily nutrition.
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

      {/* Feature Cards Grid */}
      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.25rem', color: '#FFFFFF' }}>
        Kitchen & Health Features
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Card 1: Pantry Scanner */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: 'var(--coral-soft)', color: 'var(--coral-primary)', border: '1px solid rgba(255, 107, 87, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Camera size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.65rem', color: '#FFFFFF' }}>
              Fridge & Pantry Vision Scanner
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Upload or snap a photo of your shelves to identify ingredients and instantly craft step-by-step custom recipes.
            </p>
          </div>
          <button onClick={() => onNavigate('analyze')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Open Pantry Scanner</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Card 2: Calorie & Meal Scanner */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: 'var(--honey-soft)', color: 'var(--honey-amber)', border: '1px solid rgba(244, 185, 66, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Flame size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.65rem', color: '#FFFFFF' }}>
              Meal Calorie & Macro Estimator
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Take a photo of any cooked plate or snack to calculate calories, protein, carbs, fat, and log to your daily tracker.
            </p>
          </div>
          <button onClick={() => onNavigate('calories')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Scan Meal Calories</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Card 3: Saved Recipes */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: 'var(--sage-soft)', color: 'var(--sage-green)', border: '1px solid rgba(78, 170, 131, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Utensils size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.65rem', color: '#FFFFFF' }}>
              Personalized Saved Recipes
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Save your favorite recipes, view step-by-step instructions, watch YouTube cooking tutorials, and log cooked meals.
            </p>
          </div>
          <button onClick={() => onNavigate('recipes')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Browse Recipes ({recipeCount})</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>

      {/* Daily Summary Bar */}
      <div className="glass-card" style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ padding: '0.75rem', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '2.1rem' }}>{recipeCount}</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.875rem', fontWeight: 500 }}>Saved Recipes</div>
        </div>
        <div style={{ padding: '0.75rem', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--coral-primary)', fontWeight: 800, fontSize: '2.1rem' }}>{todayProtein}g</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.875rem', fontWeight: 500 }}>Today's Protein</div>
        </div>
        <div style={{ padding: '0.75rem', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--honey-amber)', fontWeight: 800, fontSize: '2.1rem' }}>{proteinGoal}g</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.875rem', fontWeight: 500 }}>Daily Goal Target</div>
        </div>
        <div style={{ padding: '0.75rem' }}>
          <div style={{ color: 'var(--sage-green)', fontWeight: 800, fontSize: '2.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle2 size={26} /> Active
          </div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.875rem', fontWeight: 500 }}>Kitchen Engine</div>
        </div>
      </div>

    </div>
  );
}
