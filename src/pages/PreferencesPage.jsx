import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, Plus, X, Shield, Award, Target, Heart, UtensilsCrossed, ChefHat } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/supabase';

export default function PreferencesPage({ userPreferences, onUpdatePreferences, showToast }) {
  const [dietary, setDietary] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [newCuisine, setNewCuisine] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [skill, setSkill] = useState('Intermediate');
  const [proteinGoal, setProteinGoal] = useState(80);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userPreferences) {
      setDietary(userPreferences.dietary_restrictions || []);
      setCuisines(userPreferences.favorite_cuisines || []);
      setAllergies(userPreferences.allergies || []);
      setSkill(userPreferences.cooking_skill || 'Intermediate');
      setProteinGoal(userPreferences.daily_protein_goal || 80);
    }
  }, [userPreferences]);

  const DIETARY_OPTIONS = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'Nut-Free', 'Halal', 'Kosher', 'Pescatarian', 'Low-FODMAP'
  ];

  const CUISINE_OPTIONS = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'Vietnamese', 'Korean',
    'Mediterranean', 'French', 'Spanish', 'Greek', 'American', 'Latin American', 'Caribbean',
    'Middle Eastern', 'Turkish', 'African', 'Ethiopian', 'German', 'British', 'Cajun & Creole',
    'Peruvian', 'Brazilian', 'Fusion'
  ];

  const SKILL_LEVELS = [
    { id: 'Beginner', title: 'Beginner', desc: 'Quick & simple 15-min recipes' },
    { id: 'Intermediate', title: 'Intermediate', desc: 'Standard home cooking & skillet meals' },
    { id: 'Advanced', title: 'Advanced', desc: 'Multi-step culinary techniques' },
    { id: 'Master Chef', title: 'Master Chef', desc: 'Gourmet restaurant-quality dishes' }
  ];

  const toggleTag = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addCustomCuisine = () => {
    if (newCuisine.trim() && !cuisines.includes(newCuisine.trim())) {
      setCuisines([...cuisines, newCuisine.trim()]);
      setNewCuisine('');
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = {
      dietary_restrictions: dietary,
      favorite_cuisines: cuisines,
      allergies: allergies,
      cooking_skill: skill,
      daily_protein_goal: Number(proteinGoal) || 80
    };

    try {
      await db.preferences.update(updated);
      onUpdatePreferences(updated);
      try { confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } }); } catch {}
      showToast('Preferences Saved! ⚙️', 'Your culinary profile has been updated.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to save preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      
      {/* Page Header Banner — Vibrant Ledger Card */}
      <div className="ledger-card animate-fade-in" style={{ padding: '2.25rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--gold)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'var(--border-thick)', boxShadow: 'var(--shadow-hard-sm)' }}>
            <Settings size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
              <span className="tag-badge" style={{ backgroundColor: 'var(--pine)', color: '#FFF' }}>
                <ChefHat size={14} /> TASTE & HEALTH PROFILE
              </span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>
                GLOBAL RECIPE ENGINE
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.15 }}>
              Culinary Preferences & <span className="highlight-gold">Profile</span>
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', marginTop: '0.3rem' }}>
              Customize your dietary restrictions, favorite cuisines, and skill level. PantryPal tailors every recipe to these settings.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* 1. Dietary Restrictions */}
        <div className="ledger-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={22} style={{ color: 'var(--rust)' }} /> Dietary Restrictions & Diets
            </h3>
            {dietary.length > 0 && (
              <span className="tag-badge" style={{ backgroundColor: 'var(--rust-soft)', color: 'var(--rust-dark)' }}>
                {dietary.length} selected
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {DIETARY_OPTIONS.map((opt) => {
              const selected = dietary.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleTag(dietary, setDietary, opt)}
                  className={`btn btn-sm btn-pill ${selected ? 'btn-rust' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.5rem 1.15rem',
                    boxShadow: selected ? 'var(--shadow-hard-sm)' : 'none',
                    transform: selected ? 'translate(-1px, -1px)' : 'none'
                  }}
                >
                  {selected && <Check size={16} />} {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Favorite Cuisines */}
        <div className="ledger-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={22} style={{ color: 'var(--gold)' }} /> Favorite Regional Cuisines
            </h3>
            {cuisines.length > 0 && (
              <span className="tag-badge" style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}>
                {cuisines.length} selected
              </span>
            )}
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Select your preferred regional flavors or add a custom cuisine below.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.5rem' }}>
            {CUISINE_OPTIONS.map((opt) => {
              const selected = cuisines.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleTag(cuisines, setCuisines, opt)}
                  className={`btn btn-sm btn-pill ${selected ? 'btn-gold' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.45rem 1rem',
                    boxShadow: selected ? 'var(--shadow-hard-sm)' : 'none',
                    transform: selected ? 'translate(-1px, -1px)' : 'none'
                  }}
                >
                  {selected && <Check size={15} />} {opt}
                </button>
              );
            })}

            {/* Custom Cuisines */}
            {cuisines.filter(c => !CUISINE_OPTIONS.includes(c)).map((custom) => (
              <button
                type="button"
                key={custom}
                onClick={() => toggleTag(cuisines, setCuisines, custom)}
                className="btn btn-sm btn-pill btn-sage"
                style={{
                  fontSize: '0.875rem',
                  padding: '0.45rem 1rem',
                  boxShadow: 'var(--shadow-hard-sm)'
                }}
              >
                <Check size={15} /> {custom}
              </button>
            ))}
          </div>

          {/* Add Custom Cuisine Input */}
          <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Add custom cuisine (e.g. Tex-Mex, Moroccan)..."
              value={newCuisine}
              onChange={(e) => setNewCuisine(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCuisine())}
            />
            <button type="button" onClick={addCustomCuisine} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add Custom
            </button>
          </div>
        </div>

        {/* 3. Allergies & Intolerances */}
        <div className="ledger-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} style={{ color: 'var(--rust)' }} /> Allergies & Avoided Ingredients
          </h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            These ingredients will be strictly flagged or substituted in all generated recipes.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {allergies.map((all, idx) => (
              <span
                key={idx}
                className="pinned-tag"
                style={{
                  backgroundColor: 'var(--rust-soft)',
                  color: 'var(--rust-dark)'
                }}
              >
                {all}
                <button type="button" onClick={() => removeAllergy(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rust-dark)', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                  <X size={15} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Peanuts, Shellfish, Soy, Mushrooms..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
            />
            <button type="button" onClick={addAllergy} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add Allergy
            </button>
          </div>
        </div>

        {/* 4. Skill Level & Protein Goal */}
        <div className="ledger-card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
          
          {/* Skill Level Selection Cards */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ChefHat size={20} style={{ color: 'var(--gold)' }} /> Cooking Skill Level
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {SKILL_LEVELS.map((lvl) => {
                const selected = skill === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setSkill(lvl.id)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'var(--border-thick)',
                      backgroundColor: selected ? 'var(--gold-soft)' : 'var(--card-warm)',
                      boxShadow: selected ? 'var(--shadow-hard)' : 'var(--shadow-hard-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transform: selected ? 'translate(-2px, -2px)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.975rem', color: 'var(--ink)' }}>
                        {lvl.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                        {lvl.desc}
                      </div>
                    </div>
                    {selected && (
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--pine)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Protein Target Goal */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={20} style={{ color: 'var(--pine)' }} /> Daily Protein Target (grams)
            </h3>
            
            <div style={{ backgroundColor: 'var(--card-warm)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: 'var(--border-thick)', boxShadow: 'var(--shadow-hard-sm)', textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.75rem', fontWeight: 800, color: 'var(--pine)', lineHeight: 1 }}>
                {proteinGoal}g
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginTop: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Daily Target Protein Intake
              </div>
            </div>

            <input
              type="range"
              min="20"
              max="250"
              step="5"
              value={proteinGoal}
              onChange={(e) => setProteinGoal(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--pine)', cursor: 'pointer', marginBottom: '0.75rem', height: '8px' }}
            />
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              Slide to adjust your daily protein target for the Health & Nutrition dashboard.
            </p>
          </div>

        </div>

        {/* Submit Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="submit" disabled={isSaving} className="btn btn-primary btn-lg" style={{ padding: '0.95rem 3rem' }}>
            <Save size={20} /> {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

      </form>

    </div>
  );
}
