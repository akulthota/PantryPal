import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Activity, Settings, Home, Menu, X, Database, CheckCircle2, AlertCircle, Info, User, LogIn, LogOut, Flame, HeartPulse, ChevronDown, ChevronUp, ArrowRight, Target } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
  }, [user, activeTab]);

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
      {/* Vercel Web Analytics & Speed Insights */}
      <Analytics />
      <SpeedInsights />
      
      {/* Sticky Vibrant Ledger & Neubrutalist Header Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(250, 246, 233, 0.96)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: 'var(--border-thick)',
          boxShadow: '0 4px 0px var(--ink)',
          transition: 'all 0.2s var(--ease-snappy)'
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
          {/* 1. Left: Official Brand Logo — PantryPal (Editorial Fraunces Serif) */}
          <div
            onClick={() => {
              setActiveTab('home');
              setHealthDashboardOpen(false);
              setMobileMenuOpen(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: 'var(--gold)',
                border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0px var(--ink)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                src="/logo.png"
                alt="PantryPal"
                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Pantry<span style={{ color: 'var(--rust)', fontStyle: 'italic' }}>Pal</span>
            </span>
          </div>

          {/* 2. Center: Navigation Links + Tactile Health Dashboard Pill */}
          <div className="desktop-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setHealthDashboardOpen(false);
                  }}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: isActive ? 'var(--gold)' : 'transparent',
                    color: 'var(--ink)',
                    border: isActive ? '2px solid var(--ink)' : '2px solid transparent',
                    boxShadow: isActive ? '2px 2px 0px var(--ink)' : 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem'
                  }}
                >
                  <Icon size={16} color="var(--ink)" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Health Dashboard Centered Tactile Pill Button */}
            <button
              onClick={() => setHealthDashboardOpen(!healthDashboardOpen)}
              className="btn btn-sm btn-pill"
              style={{
                backgroundColor: healthDashboardOpen ? 'var(--pine)' : 'var(--card)',
                color: healthDashboardOpen ? '#FFFDF8' : 'var(--ink)',
                border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0px var(--ink)',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
            >
              <HeartPulse size={16} color={healthDashboardOpen ? 'var(--gold)' : 'var(--rust)'} />
              <span>Health Log</span>
              {healthDashboardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* 3. Right: User Auth Stack & Mobile Menu Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0, justifyContent: 'flex-end' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', backgroundColor: 'var(--paper-deep)', padding: '4px 10px', border: '1.5px solid var(--ink)', borderRadius: '6px' }}>
                  {user.email?.split('@')[0] || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline"
                  title="Sign out"
                >
                  <LogOut size={14} color="var(--rust)" /> Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn btn-gold btn-sm"
              >
                <User size={15} /> Log In
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                backgroundColor: 'var(--card)',
                border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0px var(--ink)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--ink)',
                padding: '6px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* TOP HEALTH & NUTRITION DASHBOARD ANIMATED DROPDOWN BAR */}
        {healthDashboardOpen && (
          <div
            className="animate-fade-in"
            style={{
              backgroundColor: 'var(--paper-deep)',
              borderBottom: 'var(--border-thick)',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 6px 0px var(--ink)',
              position: 'relative',
              zIndex: 90
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setHealthDashboardOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                backgroundColor: 'var(--card)',
                border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0px var(--ink)',
                color: 'var(--ink)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Health Dashboard"
            >
              <X size={16} />
            </button>

            <div
              style={{
                maxWidth: '1150px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
                justifyContent: 'center',
                paddingRight: '1rem'
              }}
            >
              
              {/* Metric 1: Today's Calories */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--card)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'var(--gold-soft)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--ink)' }}>
                  <Flame size={22} color="var(--rust)" />
                </div>
                <div>
                  <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Calories Logged Today</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{todayCalories} <span style={{ fontSize: '0.825rem', color: 'var(--ink-soft)' }}>kcal</span></div>
                </div>
              </div>

              {/* Metric 2: Today's Protein */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--card)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'var(--sage-soft)', color: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--ink)' }}>
                  <Target size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span className="mono">Daily Protein Goal</span>
                    <span style={{ color: 'var(--sage)', fontWeight: 800 }}>{proteinPercent}%</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{todayProtein}g / {proteinGoal}g</div>
                </div>
              </div>

              {/* Metric 3: Quick Action Shortcuts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setActiveTab('calories');
                    setHealthDashboardOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-gold btn-sm"
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  <Flame size={16} /> Scan Meal Calories
                </button>
                <button
                  onClick={() => {
                    setActiveTab('protein');
                    setHealthDashboardOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  <Activity size={16} /> Protein Tracker
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: 'var(--paper-deep)', borderTop: '2px solid var(--ink)', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              onClick={() => setHealthDashboardOpen(!healthDashboardOpen)}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HeartPulse size={18} color="var(--rust)" />
                <span>Toggle Health Log</span>
              </div>
              {healthDashboardOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setHealthDashboardOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`btn ${isActive ? 'btn-gold' : 'btn-outline'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <Icon size={18} />
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
          <RecipesPage showToast={showToast} initialTab="saved" />
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
            backgroundColor: '#FFFFFF',
            border: `1px solid ${toast.type === 'error' ? 'var(--coral-primary)' : 'var(--sage-green)'}`,
            color: 'var(--text-heading)',
            padding: '0.95rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
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
            <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-heading)' }}>{toast.title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* Rich Pine Ledger Footer */}
      <footer
        style={{
          backgroundColor: 'var(--pine)',
          borderTop: 'var(--border-thicker)',
          color: '#DCE4D0',
          padding: '3rem 1.5rem 2rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--gold)', border: '2px solid #FFFDF8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.png" alt="PantryPal" style={{ height: '22px', width: 'auto' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, color: '#FFFDF8' }}>
                  Pantry<span style={{ color: 'var(--gold)' }}>Pal</span>
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#B6C4A8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Know what's in your kitchen before you open the fridge. Intelligent shelf vision scanning, zero-waste recipe crafting, and automated nutrition logging.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--gold)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <Database size={13} />
                <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}</span>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold)', marginBottom: '1rem', fontWeight: 800 }}>
                Kitchen Tools
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                <span style={{ cursor: 'pointer', color: '#C5D2BA' }} onClick={() => setActiveTab('analyze')}>Pantry Vision Scanner</span>
                <span style={{ cursor: 'pointer', color: '#C5D2BA' }} onClick={() => setActiveTab('analyze')}>Custom Recipe Generator</span>
                <span style={{ cursor: 'pointer', color: '#C5D2BA' }} onClick={() => setActiveTab('calories')}>Calorie & Macro Scanner</span>
                <span style={{ cursor: 'pointer', color: '#C5D2BA' }} onClick={() => setActiveTab('protein')}>Daily Protein Tracker</span>
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold)', marginBottom: '1rem', fontWeight: 800 }}>
                Navigation
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                <span style={{ cursor: 'pointer', color: '#C5D2BA' }} onClick={() => setActiveTab('home')}>Home Overview</span>
                <span style={{ cursor: 'pointer', color: '#C5D2BA' }} onClick={() => setActiveTab('recipes')}>Saved Recipes ({recipeCount})</span>
                <span style={{ cursor: 'pointer', color: '#C5D2BA' }} onClick={() => setActiveTab('preferences')}>Dietary & Cuisines</span>
                <a
                  href="https://github.com/akulthota/PantryPal"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--gold)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  ⭐ Open Source on GitHub
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.8rem',
              color: '#8D9B7F',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <span>© 2026 PantryPal · Made for real kitchens</span>
            <span>Zero Food Waste · Cook from what you have</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
