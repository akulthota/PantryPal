import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Activity, Settings, Home, Menu, X, Database, CheckCircle2, AlertCircle, Info, User, LogIn, LogOut, Flame } from 'lucide-react';
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
  const [todayProtein, setTodayProtein] = useState(0);

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
      const sum = todayLogs.reduce((acc, l) => acc + (Number(l.total_protein) || 0), 0);
      setTodayProtein(sum);
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

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analyze', label: 'Pantry Scanner', icon: Camera },
    { id: 'calories', label: 'Calorie Scanner', icon: Flame },
    { id: 'recipes', label: 'Saved Recipes', icon: Utensils },
    { id: 'protein', label: 'Protein Tracker', icon: Activity },
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
          backgroundColor: 'rgba(12, 13, 56, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(127, 153, 245, 0.2)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div
          style={{
            maxWidth: '1350px',
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
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0, marginRight: '1rem' }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f6266f0b1234320ee6e827/43c4aa785_logo.png"
              alt="PantryPal Logo"
              style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', filter: 'drop-shadow(0 0 8px rgba(242, 119, 119, 0.4))' }}
            />
            <span style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Pantry<span className="gradient-text-magma">Pal</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'nowrap' }}>
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
                    padding: '0.6rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? '1px solid var(--magma-red)' : '1px solid transparent',
                    backgroundColor: isActive ? 'rgba(242, 119, 119, 0.15)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-body)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.925rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 0 12px rgba(242, 119, 119, 0.25)' : 'none'
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? 'var(--magma-red)' : 'var(--periwinkle-glow)' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Stack: Optional User Auth Button & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, marginLeft: '1rem' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-subheading)' }}>
                  {user.email?.split('@')[0] || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', minHeight: '38px' }}
                  title="Sign out"
                >
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', minHeight: '40px' }}
              >
                <User size={16} /> Log In / Sign Up
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-heading)', padding: '6px' }}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: 'var(--bg-card-solid)', borderTop: '1px solid var(--border-glass)', padding: '0.85rem 1.25rem' }}>
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
                    border: isActive ? '1px solid var(--magma-red)' : 'none',
                    backgroundColor: isActive ? 'rgba(242, 119, 119, 0.15)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-body)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: '0.35rem',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? 'var(--magma-red)' : 'var(--cyan-glow)' }} />
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

      {/* Volcanic Night Toast Notification */}
      {toast && (
        <div
          className="animate-scale-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            backgroundColor: '#121346',
            border: `1px solid ${toast.type === 'error' ? 'var(--magma-red)' : 'var(--cyan-glow)'}`,
            color: '#FFFFFF',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: toast.type === 'error' ? '0 0 20px rgba(242, 119, 119, 0.4)' : 'var(--shadow-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '380px'
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={22} style={{ color: 'var(--magma-red)' }} />
          ) : (
            <CheckCircle2 size={22} style={{ color: 'var(--cyan-glow)' }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>{toast.title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'rgba(12, 13, 56, 0.95)',
          borderTop: '1px solid var(--border-glass)',
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
            <strong style={{ color: '#FFFFFF' }}>PantryPal</strong> © 2026 — Intelligent Kitchen Assistant.
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.2rem 0.65rem',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isSupabaseConfigured ? 'rgba(127, 245, 231, 0.15)' : 'rgba(127, 153, 245, 0.15)',
                color: isSupabaseConfigured ? 'var(--cyan-glow)' : 'var(--periwinkle-glow)',
                border: `1px solid ${isSupabaseConfigured ? 'rgba(127, 245, 231, 0.3)' : 'rgba(127, 153, 245, 0.3)'}`
              }}
            >
              <Database size={12} />
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Mode'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('home')}>Home</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('analyze')}>Pantry Scanner</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('calories')}>Calorie Scanner</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('recipes')}>Recipes</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-body)' }} onClick={() => setActiveTab('preferences')}>Preferences</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
