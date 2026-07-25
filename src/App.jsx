import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Activity, Settings, Home, Menu, X, Sparkles, Database, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import HomePage from './pages/HomePage';
import AnalyzePantryPage from './pages/AnalyzePantryPage';
import RecipesPage from './pages/RecipesPage';
import ProteinTrackerPage from './pages/ProteinTrackerPage';
import PreferencesPage from './pages/PreferencesPage';
import { db, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'analyze' | 'recipes' | 'protein' | 'preferences'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [userPreferences, setUserPreferences] = useState(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const prefs = await db.preferences.get();
      setUserPreferences(prefs);

      const recipes = await db.recipes.list();
      setRecipeCount(recipes?.length || 0);

      const logs = await db.proteinLogs.list();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(l => l.logged_date === todayStr || (l.created_at && l.created_at.startsWith(todayStr)));
      const sum = todayLogs.reduce((acc, l) => acc + (Number(l.total_protein) || 0), 0);
      setTodayProtein(sum);
    } catch (e) {
      console.error('Failed to load initial app state:', e);
    }
  };

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analyze', label: 'Analyze Pantry', icon: Camera },
    { id: 'recipes', label: 'Saved Recipes', icon: Utensils },
    { id: 'protein', label: 'Protein Tracker', icon: Activity },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sticky Header Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            maxWidth: '1250px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f6266f0b1234320ee6e827/43c4aa785_logo.png"
              alt="PantryPal Logo"
              style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Pantry<span style={{ color: 'var(--primary)' }}>Pal</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.925rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Database / Environment Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isSupabaseConfigured ? 'var(--secondary-light)' : '#f1f5f9',
                color: isSupabaseConfigured ? 'var(--secondary)' : 'var(--text-muted)'
              }}
              title={isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Local Persistence Active (Connect Supabase via .env)'}
            >
              <Database size={14} />
              <span>{isSupabaseConfigured ? 'Supabase DB' : 'Local Storage'}</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '4px' }}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: 'white', borderTop: '1px solid var(--border-light)', padding: '1rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: '0.25rem',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content View Switcher */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomePage
            onNavigate={(tab) => setActiveTab(tab)}
            stats={{ recipeCount, todayProtein, proteinGoal: userPreferences?.daily_protein_goal || 80 }}
          />
        )}
        {activeTab === 'analyze' && (
          <AnalyzePantryPage
            userPreferences={userPreferences}
            onSaveRecipeSuccess={() => loadInitialData()}
            showToast={showToast}
          />
        )}
        {activeTab === 'recipes' && (
          <RecipesPage showToast={showToast} />
        )}
        {activeTab === 'protein' && (
          <ProteinTrackerPage
            userPreferences={userPreferences}
            showToast={showToast}
          />
        )}
        {activeTab === 'preferences' && (
          <PreferencesPage
            userPreferences={userPreferences}
            onUpdatePreferences={(updated) => setUserPreferences(updated)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className="animate-scale-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '380px'
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={22} /> : toast.type === 'info' ? <Info size={22} /> : <CheckCircle2 size={22} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{toast.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid var(--border-light)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>PantryPal</strong> © 2026 — AI Kitchen & Recipe Assistant powered by Gemini 3.6 Flash.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('home')}>Home</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('analyze')}>Scanner</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('recipes')}>Recipes</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('preferences')}>Preferences</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
