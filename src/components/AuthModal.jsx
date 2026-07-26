import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, ArrowRight, CheckCircle2, User, AlertCircle } from 'lucide-react';
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
          
          if (data?.user) {
            onLoginSuccess(data.user);
            showToast('Account Created', `Signed up as ${data.user.email}!`, 'success');
            onClose();
          } else {
            showToast('Confirmation Sent', 'Please check your email to confirm your account.', 'info');
            setMode('login');
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          onLoginSuccess(data.user);
          showToast('Welcome back!', `Logged in as ${data.user.email}`, 'success');
          onClose();
        }
      } else {
        const mockUser = { id: 'usr-1', email, name: email.split('@')[0] };
        onLoginSuccess(mockUser);
        showToast('Signed In', `Welcome back, ${mockUser.name}!`, 'success');
        onClose();
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('secret API key') || errMsg.includes('Forbidden')) {
        const mockUser = { id: 'usr-1', email, name: email.split('@')[0] };
        onLoginSuccess(mockUser);
        showToast(
          'Logged In (Local Mode)',
          "Note: Replace VITE_SUPABASE_ANON_KEY with your 'anon' public key in Vercel.",
          'info'
        );
        onClose();
      } else {
        showToast('Authentication Error', errMsg || 'Failed to authenticate.', 'error');
      }
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
        backgroundColor: 'rgba(12, 13, 56, 0.85)',
        backdropFilter: 'blur(12px)',
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
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--cyan-glow)',
          boxShadow: 'var(--shadow-card), var(--shadow-cyan)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-body)' }}
        >
          <X size={22} />
        </button>

        {/* Modal Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(242, 119, 119, 0.15)', color: 'var(--magma-red)', border: '1px solid rgba(242, 119, 119, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <User size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.25rem' }}>
            {mode === 'login' ? 'Welcome to PantryPal' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '0.9rem' }}>
            Save your recipes, preferences, and protein logs across devices.
          </p>
        </div>

        {/* Mode Switcher Pills */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(12, 13, 56, 0.8)', padding: '4px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
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
              backgroundColor: mode === 'login' ? 'var(--magma-red)' : 'transparent',
              color: mode === 'login' ? 'white' : 'var(--text-body)',
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
              backgroundColor: mode === 'signup' ? 'var(--magma-red)' : 'transparent',
              color: mode === 'signup' ? 'white' : 'var(--text-body)',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem', display: 'block' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--periwinkle-glow)' }} />
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--periwinkle-glow)' }} />
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

        {/* Guest Mode Divider */}
        <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0 1rem' }}>
          <div style={{ height: '1px', backgroundColor: 'var(--border-glass)', width: '100%', position: 'absolute', top: '50%' }} />
          <span style={{ backgroundColor: '#121346', padding: '0 0.75rem', position: 'relative', fontSize: '0.8rem', color: 'var(--text-body)', fontWeight: 500 }}>
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
