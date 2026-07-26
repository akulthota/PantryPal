import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Activity, Settings, Home, Menu, X, Database, CheckCircle2, AlertCircle, Info, User, LogIn, LogOut, Flame, HeartPulse, ChevronDown, ChevronUp, ArrowRight, Target } from 'lucide-react';
import HomePage from './pages/HomePage';
import AnalyzePantryPage from './pages/AnalyzePantryPage';
import CalorieScannerPage from './pages/CalorieScannerPage';
import RecipesPage from './pages/RecipesPage';
import ProteinTrackerPage from './pages/ProteinTrackerPage';
import PreferencesPage from './pages/PreferencesPage';
import AuthModal from './components/AuthModal';
import { db, isSupabaseConfigured, supabase } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const [userPreferences, setUserPreferences] = useState(null);
  const [recipeCount, setRecipeCount] = useState(0);
  
  // Today's live nutrition stats
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayFiber, setTodayFiber] = useState(0);

  const [healthDashboardOpen, setHealthDashboardOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadInitialData();
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
      }
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
    }
  };

  const loadInitialData = async () => {
    try {
      const prefs = await db.preferences.get();
      setUserPreferences(prefs);

      const recipes = await db.recipes.list();
      setRecipeCount(recipes?.length || 0);

      const logs = await db.proteinLogs.list();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(l => l.logged_date === todayStr || (l.created_at && l.created_at.startsWith(todayStr)));
      
      const sumProtein = todayLogs.reduce((acc, l) => acc + (Number(l.total_protein) || 0), 0);
      const sumCalories = todayLogs.reduce((acc, l) => acc + (Number(l.total_calories) || 0), 0);
      const sumFiber = todayLogs.reduce((acc, l) => acc + (Number(l.total_fiber) || 0), 0);
      
      setTodayProtein(sumProtein);
      setTodayCalories(sumCalories);
      setTodayFiber(sumFiber);
    } catch (e) {
      console.error('Failed to load initial app state:', e);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    showToast('Signed Out', 'You are now browsing in Guest Mode.', 'info');
  };

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const proteinGoal = userPreferences?.daily_protein_goal || 80;
  const proteinPercent = Math.min(100, Math.round((todayProtein / proteinGoal) * 100));

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analyze', label: 'Pantry Scanner', icon: Camera },
    { id: 'recipes', label: 'Saved Recipes', icon: Utensils },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      
      {/* Sticky Header Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(13, 14, 21, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'var(--shadow-card)',
          transition: 'all 0.3s var(--ease-spring)'
        }}
      >
        <div
          style={{
            maxWidth: '1350px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          {/* 1. Left: Official Brand Logo — PantryPal (Clean Line Height & No Overlap) */}
          <div
            onClick={() => setActiveTab('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f6266f0b1234320ee6e827/43c4aa785_logo.png"
              alt="PantryPal Logo"
              style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                Pantry<span className="text-coral">Pal</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', marginTop: '3px' }}>
                pantry-pal.dev
              </span>
            </div>
          </div>

          {/* 2. Center: Perfectly Centered Navigation Links + Health Dashboard Pill */}
          <div className="desktop-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
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
                    gap: '7px',
                    padding: '0.55rem 1.1rem',
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--coral-soft)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-body)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s var(--ease-spring)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={17} style={{ color: isActive ? 'var(--coral-primary)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Health Dashboard Centered Pill Toggle Button */}
            <button
              onClick={() => setHealthDashboardOpen(!healthDashboardOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '0.55rem 1.15rem',
                borderRadius: '20px',
                backgroundColor: healthDashboardOpen ? 'var(--coral-soft)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${healthDashboardOpen ? 'var(--coral-primary)' : 'rgba(255, 255, 255, 0.12)'}`,
                color: healthDashboardOpen ? 'var(--coral-primary)' : 'var(--text-subheading)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s var(--ease-spring)'
              }}
            >
              <HeartPulse size={17} style={{ color: healthDashboardOpen ? 'var(--coral-primary)' : 'var(--sage-green)' }} />
              <span>Health Dashboard</span>
              {healthDashboardOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {/* 3. Right: User Auth Stack & Mobile Menu Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0, justifyContent: 'flex-end' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-subheading)' }}>
                  {user.email?.split('@')[0] || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem', minHeight: '36px' }}
                  title="Sign out"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem', minHeight: '38px' }}
              >
                <User size={15} /> Log In / Sign Up
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-heading)', padding: '6px' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* TOP HEALTH & NUTRITION DASHBOARD ANIMATED DROPDOWN BAR */}
        {healthDashboardOpen && (
          <div
            className="animate-fade-in"
            style={{
              backgroundColor: '#141522',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
              position: 'relative',
              zIndex: 90
            }}
          >
            <div
              style={{
                maxWidth: '1150px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              
              {/* Metric 1: Today's Calories */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1.1rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--coral-soft)', color: 'var(--coral-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 107, 87, 0.2)' }}>
                  <Flame size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Calories Logged Today</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>{todayCalories} <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>kcal</span></div>
                </div>
              </div>

              {/* Metric 2: Today's Protein */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem 1.1rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--honey-soft)', color: 'var(--honey-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(244, 185, 66, 0.2)' }}>
                  <Target size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span>Protein Target</span>
                    <span style={{ color: 'var(--coral-primary)', fontWeight: 700 }}>{proteinPercent}%</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>{todayProtein}g / {proteinGoal}g</div>
                </div>
              </div>

              {/* Metric 3: Quick Action Shortcuts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setActiveTab('calories'); setHealthDashboardOpen(false); }}
                  className="btn btn-amber"
                  style={{ padding: '0.65rem 1.1rem', fontSize: '0.875rem', flex: 1, minWidth: '150px', justifyContent: 'center' }}
                >
                  <Flame size={17} /> Scan Meal Calories
                </button>
                <button
                  onClick={() => { setActiveTab('protein'); setHealthDashboardOpen(false); }}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 1.1rem', fontSize: '0.875rem', flex: 1, minWidth: '150px', justifyContent: 'center' }}
                >
                  <Activity size={17} /> Protein Tracker
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: '#141522', borderTop: '1px solid var(--border-subtle)', padding: '0.85rem 1.25rem' }}>
            <button
              onClick={() => {
                setHealthDashboardOpen(!healthDashboardOpen);
                setMobileMenuOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--coral-soft)',
                border: '1px solid rgba(255, 107, 87, 0.25)',
                color: 'var(--coral-primary)',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HeartPulse size={20} />
                <span>Toggle Health Dashboard</span>
              </div>
              {healthDashboardOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

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
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? '1px solid var(--border-active)' : 'none',
                    backgroundColor: isActive ? 'var(--coral-soft)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-body)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: '0.35rem',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? 'var(--coral-primary)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content View Switcher */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {activeTab === 'home' && (
          <HomePage
            onNavigate={(tab) => setActiveTab(tab)}
            stats={{ recipeCount, todayProtein, proteinGoal: userPreferences?.daily_protein_goal || 80 }}
          />
        )}
        {activeTab === 'analyze' && (
          <AnalyzePantryPage
            user={user}
            userPreferences={userPreferences}
            onSaveRecipeSuccess={() => loadInitialData()}
            showToast={showToast}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}
        {activeTab === 'calories' && (
          <CalorieScannerPage
            showToast={showToast}
            onNavigate={(tab) => setActiveTab(tab)}
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

      {/* Optional Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={user}
        onLoginSuccess={(usr) => setUser(usr)}
        showToast={showToast}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className="animate-scale-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            backgroundColor: '#181A2A',
            border: `1px solid ${toast.type === 'error' ? 'var(--coral-primary)' : 'var(--sage-green)'}`,
            color: '#FFFFFF',
            padding: '0.95rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '380px'
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={22} style={{ color: 'var(--coral-primary)' }} />
          ) : (
            <CheckCircle2 size={22} style={{ color: 'var(--sage-green)' }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#FFFFFF' }}>{toast.title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#0A0B11',
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-body)',
          fontSize: '0.875rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '1350px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <strong style={{ color: '#FFFFFF' }}>PantryPal</strong> (pantry-pal.dev) © 2026 — Intelligent Kitchen Assistant.
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.2rem 0.65rem',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-subheading)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Database size={12} />
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('home')}>Home</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('analyze')}>Pantry Scanner</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('recipes')}>Saved Recipes</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('preferences')}>Preferences</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
