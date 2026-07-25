import React from 'react';
import { Camera, Utensils, Activity, ArrowRight, Sparkles, ShieldCheck, HeartPulse, Flame } from 'lucide-react';

export default function HomePage({ onNavigate, stats = {} }) {
  const { recipeCount = 0, todayProtein = 0, proteinGoal = 80 } = stats;

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      {/* Hero Welcome Banner */}
      <div
        className="animate-slide-in glass-card"
        style={{
          padding: '3rem',
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Sparkles size={16} /> Powered by Gemini 3.6 Flash AI
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1rem',
              letterSpacing: '-0.03em',
              background: 'var(--primary-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Welcome to PantryPal
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Your intelligent kitchen assistant. Snap a photo of your fridge or pantry, and PantryPal identifies your ingredients, generates personalized recipes, and helps eliminate food waste.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('analyze')}
              className="btn btn-primary"
              style={{ fontSize: '1.05rem', padding: '0.85rem 1.75rem' }}
            >
              <Camera size={20} /> Scan Fridge Now
            </button>
            <button
              onClick={() => onNavigate('recipes')}
              className="btn btn-outline"
              style={{ fontSize: '1.05rem', padding: '0.85rem 1.75rem' }}
            >
              <Utensils size={20} /> Saved Recipes
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
        Explore Features
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Card 1: AI Scanner */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Camera size={28} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              AI Fridge & Pantry Scanner
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', marginBottom: '1.5rem' }}>
              Snap a photo of your open fridge, freezer, or pantry. Gemini 3.6 Flash identifies all your visible ingredients instantly.
            </p>
          </div>
          <button onClick={() => onNavigate('analyze')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Scan Pantry</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Card 2: Personalized Recipes */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Utensils size={28} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Personalized AI Recipes
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', marginBottom: '1.5rem' }}>
              Get delicious step-by-step recipes tailored to your dietary restrictions, favorite cuisines, and skill level.
            </p>
          </div>
          <button onClick={() => onNavigate('recipes')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>View Saved Recipes ({recipeCount})</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Card 3: Protein & Nutrition */}
        <div
          className="glass-card feature-card-hover"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Activity size={28} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Protein & Nutrition Tracker
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', marginBottom: '1.5rem' }}>
              Track daily protein goals, analyze macro sources (animal, plant, dairy), and receive AI-suggested protein boosts.
            </p>
          </div>
          <button onClick={() => onNavigate('protein')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Track Intake ({todayProtein}g / {proteinGoal}g)</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>

      {/* Daily Kitchen Highlights Bar */}
      <div className="glass-card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ padding: '1rem', borderRight: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '2.2rem' }}>{recipeCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Saved Recipes</div>
        </div>
        <div style={{ padding: '1rem', borderRight: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '2.2rem' }}>{todayProtein}g</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Today's Protein Log</div>
        </div>
        <div style={{ padding: '1rem', borderRight: '1px solid var(--border-light)' }}>
          <div style={{ color: '#d97706', fontWeight: 800, fontSize: '2.2rem' }}>{proteinGoal}g</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Daily Goal</div>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Flame size={28} /> AI
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Multimodal Engine</div>
        </div>
      </div>
    </div>
  );
}
