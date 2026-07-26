import React from 'react';
import { Camera, Utensils, Activity, ArrowRight, Sparkles, Flame, CheckCircle, Flame as LavaIcon, ShieldCheck } from 'lucide-react';

export default function HomePage({ onNavigate, stats = {} }) {
  const { recipeCount = 0, todayProtein = 0, proteinGoal = 80 } = stats;

  return (
    <div style={{ maxWidth: '1250px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      
      {/* Hero Welcome Banner with Volcanic Night Glow */}
      <div
        className="animate-slide-in glass-card"
        style={{
          padding: '3.5rem 3rem',
          marginBottom: '2.5rem',
          background: 'radial-gradient(ellipse at 80% 20%, rgba(242, 119, 119, 0.15) 0%, rgba(245, 165, 91, 0.08) 45%, rgba(18, 19, 70, 0.85) 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(242, 119, 119, 0.25)',
          boxShadow: 'var(--shadow-card), 0 0 30px rgba(242, 119, 119, 0.1)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(242, 119, 119, 0.15)', color: 'var(--magma-red)', border: '1px solid rgba(242, 119, 119, 0.3)', padding: '0.4rem 1.1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            <LavaIcon size={16} /> Volcanic Night Kitchen Assistant
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
              color: '#FFFFFF'
            }}
          >
            Welcome to <span className="gradient-text-magma">PantryPal</span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-body)', marginBottom: '2.25rem', lineHeight: 1.65 }}>
            Your personal culinary assistant. Snap a photo of your fridge or meal to organize ingredients, calculate calories, discover personalized recipes, and track your daily macros.
          </p>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('analyze')}
              className="btn btn-primary"
              style={{ fontSize: '1.05rem', padding: '0.85rem 1.85rem' }}
            >
              <Camera size={20} /> Scan Pantry Now
            </button>
            <button
              onClick={() => onNavigate('calories')}
              className="btn btn-amber"
              style={{ fontSize: '1.05rem', padding: '0.85rem 1.85rem' }}
            >
              <Flame size={20} /> Calorie Scanner
            </button>
            <button
              onClick={() => onNavigate('recipes')}
              className="btn btn-outline"
              style={{ fontSize: '1.05rem', padding: '0.85rem 1.85rem' }}
            >
              <Utensils size={20} /> Saved Recipes
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: '#FFFFFF' }}>
        Kitchen Tools & Features
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Card 1: Pantry Scanner */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(127, 245, 231, 0.15)', color: 'var(--cyan-glow)', border: '1px solid rgba(127, 245, 231, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Camera size={28} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: '#FFFFFF' }}>
              Fridge & Pantry Scanner
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.975rem', marginBottom: '1.5rem' }}>
              Snap a photo of your fridge, freezer, or shelves to automatically identify all your available ingredients in seconds.
            </p>
          </div>
          <button onClick={() => onNavigate('analyze')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Scan Pantry</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Card 2: Calorie & Meal Scanner */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(242, 119, 119, 0.15)', color: 'var(--magma-red)', border: '1px solid rgba(242, 119, 119, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Flame size={28} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: '#FFFFFF' }}>
              Calorie & Nutrition Scanner
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.975rem', marginBottom: '1.5rem' }}>
              Take a photo of any prepared plate or snack to estimate total calories, protein, carbs, fat, and log to daily goals.
            </p>
          </div>
          <button onClick={() => onNavigate('calories')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Scan Meal Calories</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Card 3: Personalized Recipes */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(245, 165, 91, 0.15)', color: 'var(--lava-amber)', border: '1px solid rgba(245, 165, 91, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Utensils size={28} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: '#FFFFFF' }}>
              Personalized Recipe Generator
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.975rem', marginBottom: '1.5rem' }}>
              Get step-by-step recipes tailored to your dietary restrictions, favorite cuisines, and cooking skill level.
            </p>
          </div>
          <button onClick={() => onNavigate('recipes')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Browse Recipes ({recipeCount})</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>

      {/* Daily Summary Bar */}
      <div className="glass-card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ padding: '1rem', borderRight: '1px solid var(--border-glass)' }}>
          <div style={{ color: 'var(--cyan-glow)', fontWeight: 800, fontSize: '2.2rem' }}>{recipeCount}</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.9rem', fontWeight: 500 }}>Saved Recipes</div>
        </div>
        <div style={{ padding: '1rem', borderRight: '1px solid var(--border-glass)' }}>
          <div style={{ color: 'var(--magma-red)', fontWeight: 800, fontSize: '2.2rem' }}>{todayProtein}g</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.9rem', fontWeight: 500 }}>Today's Protein</div>
        </div>
        <div style={{ padding: '1rem', borderRight: '1px solid var(--border-glass)' }}>
          <div style={{ color: 'var(--sulphur-gold)', fontWeight: 800, fontSize: '2.2rem' }}>{proteinGoal}g</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.9rem', fontWeight: 500 }}>Daily Goal Target</div>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--cyan-glow)', fontWeight: 800, fontSize: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <CheckCircle size={28} /> Active
          </div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.9rem', fontWeight: 500 }}>Volcanic Engine</div>
        </div>
      </div>
    </div>
  );
}
