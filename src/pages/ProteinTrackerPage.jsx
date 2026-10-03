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

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayLogs = logs.filter(l => {
    if (l.logged_date === todayStr) return true;
    if (l.local_date === todayStr) return true;
    if (l.created_at) {
      try {
        const cDate = new Date(l.created_at);
        const cStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
        return cStr === todayStr;
      } catch (e) {}
    }
    return false;
  });
  
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
      
      {/* Page Title — Vibrant Ledger Card */}
      <div className="ledger-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <span className="tag-badge" style={{ backgroundColor: 'var(--sage)', color: '#FFF' }}>
                <Target size={14} /> DAILY NUTRITION
              </span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>
                GOAL: {goal}G / DAY
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15 }}>
              Protein & Nutrition <span className="highlight-gold">Tracker</span>
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', marginTop: '0.4rem', maxWidth: '650px' }}>
              Track daily protein goals, analyze nutrition metrics, and get AI recommendations tailored to your targets.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--paper)', padding: '6px', borderRadius: 'var(--radius-sm)', border: 'var(--border-thick)', boxShadow: 'var(--shadow-hard-sm)' }}>
            <button
              onClick={() => setTimeframe('week')}
              className={`btn btn-sm ${timeframe === 'week' ? 'btn-primary' : 'btn-outline'}`}
              style={{ minHeight: '32px' }}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`btn btn-sm ${timeframe === 'month' ? 'btn-primary' : 'btn-outline'}`}
              style={{ minHeight: '32px' }}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Goal Progress Banner */}
      <div className="ledger-card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'var(--card-warm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={22} style={{ color: 'var(--rust)' }} /> Today's Goal Progress
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
              <strong style={{ color: 'var(--ink)' }}>{todayProteinTotal}g</strong> logged out of <strong style={{ color: 'var(--pine)' }}>{goal}g</strong> daily goal
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--pine)' }}>
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Neubrutalist Progress Bar */}
        <div style={{ width: '100%', height: '18px', backgroundColor: 'var(--paper)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', border: 'var(--border-thick)', boxShadow: 'var(--shadow-hard-sm)' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--gold) 0%, var(--sage) 100%)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.5s ease'
            }}
          />
        </div>
      </div>

      {/* Metrics Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="ledger-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--card-warm)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontSize: '2rem', fontWeight: 800 }}>{todayCaloriesTotal}</div>
          <div style={{ color: 'var(--ink-faint)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Calories Today</div>
        </div>
        <div className="ledger-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--sage-soft)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--pine)', fontSize: '2rem', fontWeight: 800 }}>{todayFiberTotal}g</div>
          <div style={{ color: 'var(--pine)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Fiber Today</div>
        </div>
        <div className="ledger-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--rust-soft)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--rust-dark)', fontSize: '2rem', fontWeight: 800 }}>{animalTotal}g</div>
          <div style={{ color: 'var(--rust-dark)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Animal Protein</div>
        </div>
        <div className="ledger-card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--gold-soft)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-dark)', fontSize: '2rem', fontWeight: 800 }}>{plantTotal}g</div>
          <div style={{ color: 'var(--gold-dark)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Plant Protein</div>
        </div>
      </div>

      {/* Log Form & AI Protein Boost Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Form: Add Protein Item */}
        <div className="ledger-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
            <Plus size={20} style={{ color: 'var(--rust)' }} /> Log Protein Meal / Item
          </h3>
          <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem', display: 'block' }}>Food Item Name *</label>
              <input type="text" className="input-control" placeholder="e.g. Chicken Breast, Greek Yogurt..." value={item} onChange={e => setItem(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem', display: 'block' }}>Protein (g) *</label>
                <input type="number" className="input-control" placeholder="30" value={totalProtein} onChange={e => setTotalProtein(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem', display: 'block' }}>Source Category</label>
                <select className="input-control" value={proteinCategory} onChange={e => setProteinCategory(e.target.value)}>
                  <option value="animal">Animal</option>
                  <option value="plant">Plant</option>
                  <option value="dairy">Dairy</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem', display: 'block' }}>Calories (optional)</label>
                <input type="number" className="input-control" placeholder="250" value={calories} onChange={e => setCalories(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem', display: 'block' }}>Fiber (g)</label>
                <input type="number" className="input-control" placeholder="4" value={fiber} onChange={e => setFiber(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={18} /> Add Entry to Log
            </button>
          </form>
        </div>

        {/* AI Protein Boost Recommendations */}
        <div className="ledger-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
              <Sparkles size={20} style={{ color: 'var(--gold)' }} /> High-Protein Ideas
            </h3>
            <button onClick={fetchProteinBoosts} disabled={isFetchingBoost} className="btn btn-sm btn-outline">
              {isFetchingBoost ? 'Analyzing...' : 'Get Ideas'}
            </button>
          </div>

          {suggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ backgroundColor: 'var(--paper)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--gold)', border: 'var(--border-thick)', boxShadow: 'var(--shadow-hard-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', color: 'var(--ink)' }}>
                    <span>{s.title}</span>
                    <span style={{ color: 'var(--pine)', fontWeight: 800 }}>+{s.protein_g}g protein</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{s.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--ink-soft)' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '1.25rem' }}>Need ideas to meet your daily protein goal?</p>
              <button onClick={fetchProteinBoosts} className="btn btn-gold">
                <Sparkles size={16} /> Generate High-Protein Snacks
              </button>
            </div>
          )}
        </div>

      </div>

      {/* History Log List — PINNED STICKY NOTE STYLE for listing food items */}
      <div className="sticky-note sticky-note-parchment" style={{ padding: '2.5rem 2rem 2rem 2rem' }}>
        <div className="sticky-pin sticky-pin-gold"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid var(--ink)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>
              Recent Intake Log
            </h3>
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', fontWeight: 600 }}>
              RECORDED MEALS & INGREDIENT ENTRIES
            </span>
          </div>
          <span className="tag-badge" style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}>
            {logs.length} Total Logs
          </span>
        </div>

        {logs.length > 0 ? (
          <ul className="sticky-list">
            {logs.map((log) => (
              <li key={log.id} className="sticky-list-item" style={{ flexWrap: 'wrap', gap: '0.5rem', padding: '0.85rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--rust)', border: '1.5px solid var(--ink)', display: 'inline-block' }}></span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{log.item}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', display: 'flex', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
                      <span>Date: {log.logged_date}</span>
                      {log.total_calories > 0 && <span>{log.total_calories} kcal</span>}
                      {log.total_fiber > 0 && <span>{log.total_fiber}g fiber</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--pine)' }}>
                    +{log.total_protein}g
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="btn btn-sm btn-outline"
                    style={{ padding: '4px 8px', minHeight: 'auto', color: 'var(--rust)' }}
                    title="Delete log"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: '2rem', fontFamily: 'var(--font-mono)' }}>
            No protein entries logged yet. Add your first item above!
          </p>
        )}
      </div>

    </div>
  );
}
