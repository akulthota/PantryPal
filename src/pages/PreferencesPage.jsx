import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, Plus, X, Shield, Award, Target, Heart } from 'lucide-react';
import { db } from '../lib/supabase';

export default function PreferencesPage({ userPreferences, onUpdatePreferences, showToast }) {
  const [dietary, setDietary] = useState([]);
  const [cuisines, setCuisines] = useState([]);
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

  const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'Nut-Free', 'Halal', 'Kosher'];
  const CUISINE_OPTIONS = ['Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American', 'French', 'Japanese', 'Thai', 'Middle Eastern'];
  const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Master Chef'];

  const toggleTag = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
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
      showToast('Preferences Saved', 'Your culinary profile has been updated.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to save preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      
      {/* Page Header */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          User Preferences & Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Customize your dietary restrictions, favorite cuisines, and skill level. PantryPal will tailor all generated recipes to these settings.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* 1. Dietary Restrictions */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={20} style={{ color: 'var(--accent-rose)' }} /> Dietary Restrictions & Diets
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {DIETARY_OPTIONS.map((opt) => {
              const selected = dietary.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleTag(dietary, setDietary, opt)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '20px',
                    border: selected ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                    backgroundColor: selected ? 'var(--primary-light)' : 'white',
                    color: selected ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {selected && <Check size={14} />} {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Favorite Cuisines */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: 'var(--primary)' }} /> Favorite Cuisines
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {CUISINE_OPTIONS.map((opt) => {
              const selected = cuisines.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleTag(cuisines, setCuisines, opt)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '20px',
                    border: selected ? '2px solid var(--secondary)' : '1px solid #cbd5e1',
                    backgroundColor: selected ? 'var(--secondary-light)' : 'white',
                    color: selected ? 'var(--secondary)' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {selected && <Check size={14} />} {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Allergies & Intolerances */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} style={{ color: '#d97706' }} /> Allergies & Ingredients to Avoid
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {allergies.map((all, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '16px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {all}
                <button type="button" onClick={() => removeAllergy(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309' }}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Peanuts, Shellfish, Soy..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
            />
            <button type="button" onClick={addAllergy} className="btn btn-outline">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* 4. Skill Level & Protein Goal */}
        <div className="glass-card" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} /> Cooking Skill Level
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SKILL_LEVELS.map((lvl) => (
                <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="skillLevel"
                    value={lvl}
                    checked={skill === lvl}
                    onChange={(e) => setSkill(e.target.value)}
                  />
                  <span>{lvl}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} /> Daily Protein Goal (grams)
            </h3>
            <input
              type="number"
              className="input-control"
              style={{ maxWidth: '200px' }}
              value={proteinGoal}
              onChange={(e) => setProteinGoal(e.target.value)}
              min="10"
              max="300"
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Used to calculate progress in the Protein Tracker.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem' }}>
            <Save size={20} /> {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

      </form>

    </div>
  );
}
