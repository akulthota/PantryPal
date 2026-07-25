import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, ArrowRight, CheckCircle2, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthModal({ isOpen, onClose, user, onLoginSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          showToast('Account Created', 'Check your email for confirmation link or sign in.', 'success');
          setMode('login');
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          onLoginSuccess(data.user);
          showToast('Welcome back!', `Logged in as ${data.user.email}`, 'success');
          onClose();
        }
      } else {
        // Local Session Fallback for standalone mode
        const mockUser = { id: 'usr-1', email, name: email.split('@')[0] };
        onLoginSuccess(mockUser);
        showToast('Signed In', `Welcome back, ${mockUser.name}!`, 'success');
        onClose();
      }
    } catch (err) {
      showToast('Authentication Error', err.message || 'Failed to authenticate.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem',
          position: 'relative',
          borderRadius: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={22} />
        </button>

        {/* Modal Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <User size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {mode === 'login' ? 'Welcome to PantryPal' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Save your recipes, preferences, and protein logs across devices.
          </p>
        </div>

        {/* Mode Switcher Pills */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              backgroundColor: mode === 'login' ? 'white' : 'transparent',
              color: mode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              backgroundColor: mode === 'signup' ? 'white' : 'transparent',
              color: mode === 'signup' ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-control"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input-control"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
            {isLoading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        {/* Guest Mode Divider & Quick Button */}
        <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0 1rem' }}>
          <div style={{ height: '1px', backgroundColor: 'var(--border-light)', width: '100%', position: 'absolute', top: '50%' }} />
          <span style={{ backgroundColor: 'white', padding: '0 0.75rem', position: 'relative', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            or continue without logging in
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <span>Continue as Guest</span>
          <ArrowRight size={16} />
        </button>

      </div>
    </div>
  );
}
