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
      
      {/* Page Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '2.25rem 2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)', border: '1px solid var(--coral-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '0.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--coral-soft)', color: 'var(--coral-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--coral-border)' }}>
            <Settings size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              Culinary Preferences & <span className="text-coral">Profile</span>
            </h1>
            <p style={{ color: 'var(--text-body)', fontSize: '0.975rem', marginTop: '0.2rem' }}>
              Customize your dietary restrictions, favorite cuisines, and skill level. PantryPal tailors every recipe to these settings.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* 1. Dietary Restrictions */}
        <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={22} style={{ color: 'var(--coral-primary)' }} /> Dietary Restrictions & Diets
            </h3>
            {dietary.length > 0 && (
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--coral-primary)', backgroundColor: 'var(--coral-soft)', padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
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
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '20px',
                    border: selected ? '2px solid var(--coral-primary)' : '1px solid #CBD5E1',
                    backgroundColor: selected ? 'var(--coral-soft)' : '#F8FAFC',
                    color: selected ? 'var(--coral-primary)' : '#334155',
                    fontWeight: selected ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s var(--ease-spring)',
                    boxShadow: selected ? '0 4px 12px rgba(255, 82, 82, 0.15)' : 'none'
                  }}
                >
                  {selected && <Check size={16} style={{ color: 'var(--coral-primary)' }} />} {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Favorite Cuisines */}
        <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={22} style={{ color: 'var(--honey-amber)' }} /> Favorite Regional Cuisines
            </h3>
            {cuisines.length > 0 && (
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--honey-amber)', backgroundColor: 'var(--honey-soft)', padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                {cuisines.length} selected
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
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
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '20px',
                    border: selected ? '2px solid var(--honey-amber)' : '1px solid #CBD5E1',
                    backgroundColor: selected ? 'var(--honey-soft)' : '#F8FAFC',
                    color: selected ? 'var(--honey-amber)' : '#334155',
                    fontWeight: selected ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s var(--ease-spring)',
                    boxShadow: selected ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none'
                  }}
                >
                  {selected && <Check size={15} style={{ color: 'var(--honey-amber)' }} />} {opt}
                </button>
              );
            })}

            {/* Custom Cuisines */}
            {cuisines.filter(c => !CUISINE_OPTIONS.includes(c)).map((custom) => (
              <button
                type="button"
                key={custom}
                onClick={() => toggleTag(cuisines, setCuisines, custom)}
                style={{
                  padding: '0.6rem 1.15rem',
                  borderRadius: '20px',
                  border: '2px solid var(--sage-green)',
                  backgroundColor: 'var(--sage-soft)',
                  color: 'var(--sage-green)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={15} style={{ color: 'var(--sage-green)' }} /> {custom}
              </button>
            ))}
          </div>

          {/* Add Custom Cuisine Input */}
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px' }}>
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
        <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} style={{ color: 'var(--sage-green)' }} /> Allergies & Avoided Ingredients
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {allergies.map((all, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: 'var(--coral-soft)',
                  border: '1px solid var(--coral-border)',
                  color: 'var(--coral-primary)',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '16px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {all}
                <button type="button" onClick={() => removeAllergy(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral-primary)', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px' }}>
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
        <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
          
          {/* Skill Level Selection Cards */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ChefHat size={20} style={{ color: 'var(--coral-primary)' }} /> Cooking Skill Level
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {SKILL_LEVELS.map((lvl) => {
                const selected = skill === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setSkill(lvl.id)}
                    style={{
                      padding: '0.9rem 1.1rem',
                      borderRadius: '12px',
                      border: selected ? '2px solid var(--coral-primary)' : '1px solid #E2E8F0',
                      backgroundColor: selected ? 'var(--coral-soft)' : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: selected ? 'var(--coral-primary)' : 'var(--text-heading)' }}>
                        {lvl.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {lvl.desc}
                      </div>
                    </div>
                    {selected && <Check size={18} style={{ color: 'var(--coral-primary)' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Protein Target Goal */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={20} style={{ color: 'var(--honey-amber)' }} /> Daily Protein Target (grams)
            </h3>
            
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--coral-primary)', lineHeight: 1 }}>
                {proteinGoal}g
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
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
              style={{ width: '100%', accentColor: 'var(--coral-primary)', cursor: 'pointer', marginBottom: '0.75rem' }}
            />
            <p style={{ color: 'var(--text-body)', fontSize: '0.85rem' }}>
              Slide to adjust your daily protein target for the Health & Nutrition dashboard.
            </p>
          </div>

        </div>

        {/* Submit Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ padding: '0.85rem 2.75rem', fontSize: '1.1rem' }}>
            <Save size={20} /> {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

      </form>

    </div>
  );
}
