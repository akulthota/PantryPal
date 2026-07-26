import React, { useState, useEffect } from 'react';
import { Activity, Plus, Sparkles, Flame, Trash2, Calendar, Target, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/supabase';

export default function ProteinTrackerPage({ userPreferences, showToast }) {
  const [logs, setLogs] = useState([]);
  const [timeframe, setTimeframe] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  const [item, setItem] = useState('');
  const [totalProtein, setTotalProtein] = useState('');
  const [proteinCategory, setProteinCategory] = useState('animal');
  const [calories, setCalories] = useState('');
  const [fiber, setFiber] = useState('');
  
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingBoost, setIsFetchingBoost] = useState(false);

  const goal = userPreferences?.daily_protein_goal || 80;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await db.proteinLogs.list();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.logged_date === todayStr || (l.created_at && l.created_at.startsWith(todayStr)));
  
  const todayProteinTotal = todayLogs.reduce((sum, l) => sum + (Number(l.total_protein) || 0), 0);
  const todayCaloriesTotal = todayLogs.reduce((sum, l) => sum + (Number(l.total_calories) || 0), 0);
  const todayFiberTotal = todayLogs.reduce((sum, l) => sum + (Number(l.total_fiber) || 0), 0);

  const animalTotal = logs.reduce((sum, l) => sum + (Number(l.animal_protein) || 0), 0);
  const plantTotal = logs.reduce((sum, l) => sum + (Number(l.plant_protein) || 0), 0);
  const dairyTotal = logs.reduce((sum, l) => sum + (Number(l.dairy_protein) || 0), 0);

  const progressPercent = Math.min(100, Math.round((todayProteinTotal / goal) * 100));

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!item.trim() || !totalProtein) return;

    const pVal = Number(totalProtein) || 0;
    const catAnimal = proteinCategory === 'animal' ? pVal : 0;
    const catPlant = proteinCategory === 'plant' ? pVal : 0;
    const catDairy = proteinCategory === 'dairy' ? pVal : 0;

    const entry = {
      item: item.trim(),
      total_protein: pVal,
      animal_protein: catAnimal,
      plant_protein: catPlant,
      dairy_protein: catDairy,
      total_calories: Number(calories) || 0,
      total_fiber: Number(fiber) || 0,
      logged_date: todayStr
    };

    try {
      const created = await db.proteinLogs.create(entry);
      setLogs([created, ...logs]);
      setItem('');
      setTotalProtein('');
      setCalories('');
      setFiber('');
      showToast('Logged', `Added ${pVal}g protein!`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to log protein item.', 'error');
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await db.proteinLogs.delete(id);
      setLogs(logs.filter(l => l.id !== id));
      showToast('Removed', 'Protein log entry removed.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to remove log.', 'error');
    }
  };

  const fetchProteinBoosts = async () => {
    setIsFetchingBoost(true);
    try {
      const res = await fetch('/api/protein-boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          currentIntake: todayProteinTotal,
          preferences: userPreferences || {}
        })
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setSuggestions([
        { title: 'Greek Yogurt Parfait', protein_g: 22, category: 'Dairy', description: 'Plain Greek yogurt topped with chia seeds and almond slice.' },
        { title: 'Edamame Snack Bowl', protein_g: 17, category: 'Plant', description: 'Steamed edamame pods dusted with sea salt and garlic.' },
        { title: 'Hard-Boiled Eggs (x2)', protein_g: 13, category: 'Animal', description: 'Simple, quick protein boost on the go.' }
      ]);
    } finally {
      setIsFetchingBoost(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      
      {/* Page Title */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF' }}>
              Protein & Nutrition <span className="gradient-text-magma">Tracker</span>
            </h1>
            <p style={{ color: 'var(--text-body)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Track daily protein goals, analyze nutrition metrics, and get AI recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(12, 13, 56, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setTimeframe('week')}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                backgroundColor: timeframe === 'week' ? 'var(--magma-red)' : 'transparent',
                color: timeframe === 'week' ? 'white' : 'var(--text-body)'
              }}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                backgroundColor: timeframe === 'month' ? 'var(--magma-red)' : 'transparent',
                color: timeframe === 'month' ? 'white' : 'var(--text-body)'
              }}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Goal Progress Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'radial-gradient(ellipse at top left, rgba(242, 119, 119, 0.12) 0%, rgba(18, 19, 70, 0.85) 100%)', border: '1px solid rgba(242, 119, 119, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} style={{ color: 'var(--magma-red)' }} /> Today's Goal Progress
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.9rem' }}>
              {todayProteinTotal}g logged out of {goal}g daily goal
            </p>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--magma-red)' }}>
            {progressPercent}%
          </div>
        </div>

        {/* Volcanic Progress Bar */}
        <div style={{ width: '100%', height: '14px', backgroundColor: 'rgba(12, 13, 56, 0.8)', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--magma-gradient)',
              borderRadius: '7px',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 12px rgba(242, 119, 119, 0.5)'
            }}
          />
        </div>
      </div>

      {/* Metrics Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--cyan-glow)', fontSize: '1.8rem', fontWeight: 800 }}>{todayCaloriesTotal}</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.85rem', fontWeight: 600 }}>Calories Today</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--sulphur-gold)', fontSize: '1.8rem', fontWeight: 800 }}>{todayFiberTotal}g</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.85rem', fontWeight: 600 }}>Fiber Today</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--magma-red)', fontSize: '1.8rem', fontWeight: 800 }}>{animalTotal}g</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.85rem', fontWeight: 600 }}>Animal Protein</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--lava-amber)', fontSize: '1.8rem', fontWeight: 800 }}>{plantTotal}g</div>
          <div style={{ color: 'var(--text-body)', fontSize: '0.85rem', fontWeight: 600 }}>Plant Protein</div>
        </div>
      </div>

      {/* Log Form & AI Protein Boost Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Form: Add Protein Item */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF' }}>
            <Plus size={20} style={{ color: 'var(--cyan-glow)' }} /> Log Protein Meal / Item
          </h3>
          <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem', display: 'block' }}>Food Item Name *</label>
              <input type="text" className="input-control" placeholder="e.g. Chicken Breast, Greek Yogurt..." value={item} onChange={e => setItem(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem', display: 'block' }}>Protein (g) *</label>
                <input type="number" className="input-control" placeholder="30" value={totalProtein} onChange={e => setTotalProtein(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem', display: 'block' }}>Source Category</label>
                <select className="input-control" value={proteinCategory} onChange={e => setProteinCategory(e.target.value)}>
                  <option value="animal">Animal</option>
                  <option value="plant">Plant</option>
                  <option value="dairy">Dairy</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem', display: 'block' }}>Calories (optional)</label>
                <input type="number" className="input-control" placeholder="250" value={calories} onChange={e => setCalories(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem', display: 'block' }}>Fiber (g)</label>
                <input type="number" className="input-control" placeholder="4" value={fiber} onChange={e => setFiber(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={18} /> Add Entry to Log
            </button>
          </form>
        </div>

        {/* AI Protein Boost Recommendations */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF' }}>
              <Sparkles size={20} style={{ color: 'var(--lava-amber)' }} /> High-Protein Ideas
            </h3>
            <button onClick={fetchProteinBoosts} disabled={isFetchingBoost} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
              {isFetchingBoost ? 'Analyzing...' : 'Get Ideas'}
            </button>
          </div>

          {suggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ backgroundColor: 'rgba(12, 13, 56, 0.6)', padding: '1rem', borderRadius: '10px', borderLeft: '4px solid var(--magma-red)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#FFFFFF' }}>
                    <span>{s.title}</span>
                    <span style={{ color: 'var(--magma-red)' }}>+{s.protein_g}g protein</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{s.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-body)' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Need ideas to meet your daily protein goal?</p>
              <button onClick={fetchProteinBoosts} className="btn btn-amber">
                <Sparkles size={16} /> Generate High-Protein Snacks
              </button>
            </div>
          )}
        </div>

      </div>

      {/* History Log List */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', color: '#FFFFFF' }}>Recent Intake History</h3>
        {logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(12, 13, 56, 0.6)', borderRadius: '10px', border: '1px solid var(--border-glass)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>{log.item}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', display: 'flex', gap: '1rem' }}>
                    <span>Date: {log.logged_date}</span>
                    {log.total_calories > 0 && <span>{log.total_calories} kcal</span>}
                    {log.total_fiber > 0 && <span>{log.total_fiber}g fiber</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--magma-red)' }}>
                    +{log.total_protein}g
                  </div>
                  <button onClick={() => handleDeleteLog(log.id)} style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer' }} title="Delete log">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-body)', textAlign: 'center', padding: '2rem' }}>No protein entries logged yet.</p>
        )}
      </div>

    </div>
  );
}
