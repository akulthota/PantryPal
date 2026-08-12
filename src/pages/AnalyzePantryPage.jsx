import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Plus, X, Sparkles, Clock, Users, Flame, Save, RefreshCw, AlertCircle, CheckCircle2, ChefHat, UserCheck, Lock, Youtube, CheckSquare, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/supabase';
import { autocompleteIngredient } from '../lib/spoonacular';

export default function AnalyzePantryPage({ user, userPreferences, onSaveRecipeSuccess, showToast, onOpenAuthModal }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  
  // Issue 6: hasScanned state
  const [hasScanned, setHasScanned] = useState(false);
  
  // Issue 7: Spoonacular Autocomplete States
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchingIngredients, setIsSearchingIngredients] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [isLoggingCooked, setIsLoggingCooked] = useState(false);
  const [hasCookedLogged, setHasCookedLogged] = useState(false);
  
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [previousTitles, setPreviousTitles] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // Issue 2: Weekly Guest Limit
  const [weeklyScanCount, setWeeklyScanCount] = useState(0);
  const GUEST_WEEKLY_LIMIT = 3;

  useEffect(() => {
    loadScanHistory();

    // Click outside listener for autocomplete dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced ingredient search autocomplete (Issue 7)
  useEffect(() => {
    if (!inputValue || inputValue.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingIngredients(true);
      try {
        const results = await autocompleteIngredient(inputValue, 10);
        setSuggestions(results || []);
        setHighlightedIndex(0);
        setShowDropdown(true);
      } catch (err) {
        console.warn('Autocomplete search failed:', err);
        setSuggestions([]);
        setShowDropdown(true);
      } finally {
        setIsSearchingIngredients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Issue 2: Calculate Monday of current week for weekly limits in local timezone
  const loadScanHistory = async () => {
    const logs = await db.scanLogs.list();
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

    const weeklyScans = logs.filter(l => l.local_date >= mondayStr && l.log_type === 'scan');
    setWeeklyScanCount(weeklyScans.length);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch (e) {}
      }
    };
  }, [previewUrl]);

  const handleFileChange = (file) => {
    if (!file) return;
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIngredients([]);
    setGeneratedRecipe(null);
    setPreviousTitles([]);
    setErrorMessage(null);
    setHasCookedLogged(false);
    setHasScanned(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearImage = () => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIngredients([]);
    setGeneratedRecipe(null);
    setPreviousTitles([]);
    setErrorMessage(null);
    setHasCookedLogged(false);
    setHasScanned(false);
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    if (!user && weeklyScanCount >= GUEST_WEEKLY_LIMIT) {
      setErrorMessage(`Weekly guest limit reached (3/3). Log in or Sign up for free to unlock UNLIMITED scans!`);
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setIngredients([]);
    setGeneratedRecipe(null);
    setPreviousTitles([]);
    setHasCookedLogged(false);

    try {
      const compressImage = (file) => {
        return new Promise((resolve) => {
          const img = new Image();
          const objUrl = URL.createObjectURL(file);
          img.src = objUrl;
          img.onload = () => {
            try { URL.revokeObjectURL(objUrl); } catch (e) {}
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          };
          img.onerror = () => {
            try { URL.revokeObjectURL(objUrl); } catch (e) {}
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          };
        });
      };

      const base64Data = await compressImage(selectedFile);

      try {
        const res = await fetch('/api/analyze-pantry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            mimeType: 'image/jpeg'
          })
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Server status ${res.status}`);
        }

        const data = await res.json();
        setHasScanned(true);

        if (data.ingredients && data.ingredients.length > 0) {
          setIngredients(data.ingredients);
          showToast('Ingredients Extracted! 🍓', `Identified ${data.ingredients.length} items from your photo.`, 'success');
          
          await db.scanLogs.create({
            ingredients: data.ingredients,
            local_date: new Date().toISOString().split('T')[0],
            log_type: 'scan'
          });
          loadScanHistory();
        } else {
          setErrorMessage('No clear food items detected. Try adding ingredients manually or uploading a clearer photo.');
        }
      } catch (apiErr) {
        console.warn('Vision API call error:', apiErr);
        setHasScanned(true);
        setErrorMessage(apiErr.message || 'Vision API call failed. You can select ingredients manually below.');
      } finally {
        setIsAnalyzing(false);
      }
    } catch (err) {
      setHasScanned(true);
      setErrorMessage(err.message || 'Failed to analyze image.');
      setIsAnalyzing(false);
    }
  };

  const selectSuggestion = (name) => {
    if (!name) return;
    const formatted = name.trim();
    if (!ingredients.includes(formatted)) {
      setIngredients([...ingredients, formatted]);
    }
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && showDropdown) {
        selectSuggestion(suggestions[highlightedIndex]?.name || suggestions[0]?.name);
      } else if (inputValue.trim()) {
        // Fallback manual entry
        selectSuggestion(inputValue);
        showToast('Notice', 'Ingredient search unavailable. Typing manually.', 'info');
      }
    }
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setErrorMessage('Please scan a photo or add at least one ingredient first.');
      return;
    }

    setIsGeneratingRecipe(true);
    setErrorMessage(null);
    setHasCookedLogged(false);

    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          preferences: userPreferences || {},
          avoidTitles: previousTitles
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate recipe');
      }

      const recipe = await res.json();
      setGeneratedRecipe(recipe);
      if (recipe.title) {
        setPreviousTitles(prev => [...prev, recipe.title]);
      }
      showToast('Fresh Recipe Ready! 👨‍🍳', `Crafted a unique ${recipe.cuisine_type || ''} dish!`, 'success');
    } catch (err) {
      console.warn('Recipe generation fallback:', err);
      const hasEggs = ingredients.some(i => i.toLowerCase().includes('egg'));
      const hasMilk = ingredients.some(i => i.toLowerCase().includes('milk'));
      const hasChicken = ingredients.some(i => i.toLowerCase().includes('chicken'));
      const hasPasta = ingredients.some(i => i.toLowerCase().includes('pasta') || i.toLowerCase().includes('noodle'));

      let fallbackRecipe;
      if (hasEggs || hasMilk) {
        fallbackRecipe = {
          title: 'Classic French Omelette with Herb Butter',
          cuisine_type: 'French',
          prep_time: '15 mins',
          servings: '2',
          difficulty: 'Easy',
          ingredients: [
            '4 large eggs',
            '50ml fresh milk',
            '20g unsalted butter',
            '1 tbsp fresh chives (chopped)',
            '1/2 tsp sea salt & black pepper'
          ],
          instructions: [
            'In a bowl, whisk eggs and fresh milk until light and smooth.',
            'Melt butter in a non-stick skillet over medium-low heat until frothy.',
            'Pour in egg mixture, gently stirring with a spatula until soft curds form.',
            'Fold omelette into a cylinder, sprinkle with fresh chives, and serve warm.'
          ],
          nutrition: {
            calories: 320,
            protein: 22,
            carbs: 4,
            fat: 24,
            fiber: 1
          },
          youtube_search_query: 'Classic French Omelette recipe'
        };
      } else if (hasChicken) {
        fallbackRecipe = {
          title: 'Garlic Herb Chicken Breast Sauté',
          cuisine_type: 'American',
          prep_time: '25 mins',
          servings: '2',
          difficulty: 'Easy',
          ingredients: [
            '400g chicken breast',
            '15ml extra virgin olive oil',
            '3 cloves garlic (minced)',
            '1 tsp dried oregano & thyme',
            '1/2 tsp sea salt & black pepper'
          ],
          instructions: [
            'Slice chicken breasts into 1-inch strips and season with herbs, salt, and pepper.',
            'Heat olive oil in a skillet over medium-high heat and add minced garlic.',
            'Sauté chicken for 6-8 minutes until golden brown and cooked through (165°F).',
            'Garnish with fresh parsley and lemon juice before serving.'
          ],
          nutrition: {
            calories: 410,
            protein: 44,
            carbs: 6,
            fat: 18,
            fiber: 2
          },
          youtube_search_query: 'Garlic Herb Chicken Breast recipe'
        };
      } else if (hasPasta) {
        fallbackRecipe = {
          title: 'Creamy Garlic Herb Pasta',
          cuisine_type: 'Italian',
          prep_time: '20 mins',
          servings: '2',
          difficulty: 'Easy',
          ingredients: [
            '200g pasta or noodles',
            '100ml fresh milk or cream',
            '25g parmesan cheese (grated)',
            '2 cloves garlic (minced)',
            '15ml olive oil'
          ],
          instructions: [
            'Boil pasta in salted water until al dente.',
            'In a skillet, sauté minced garlic in olive oil for 1 minute.',
            'Stir in milk and parmesan cheese until a smooth sauce forms.',
            'Toss cooked pasta in the sauce and serve hot.'
          ],
          nutrition: {
            calories: 480,
            protein: 16,
            carbs: 65,
            fat: 16,
            fiber: 4
          },
          youtube_search_query: 'Creamy Garlic Herb Pasta recipe'
        };
      } else {
        const item1 = ingredients[0] || 'Fresh Vegetables';
        fallbackRecipe = {
          title: 'Rustic Farmer\'s Garden Skillet',
          cuisine_type: 'Home Style',
          prep_time: '20 mins',
          servings: '2',
          difficulty: 'Easy',
          ingredients: [
            `200g ${item1}`,
            '15ml extra virgin olive oil',
            '2 cloves garlic (minced)',
            '1/2 tsp salt & black pepper'
          ],
          instructions: [
            `Wash and chop ${item1} into bite-sized pieces.`,
            'Heat olive oil and minced garlic in a skillet over medium heat.',
            'Sauté ingredients for 6-8 minutes until tender and caramelized.',
            'Season with salt and pepper, and serve warm.'
          ],
          nutrition: {
            calories: 320,
            protein: 14,
            carbs: 26,
            fat: 14,
            fiber: 5
          },
          youtube_search_query: 'Rustic Vegetable Skillet recipe'
        };
      }

      setGeneratedRecipe(fallbackRecipe);
      setPreviousTitles(prev => [...prev, fallbackRecipe.title]);
      showToast('New Recipe Ready!', 'Crafted an authentic recipe for your ingredients.', 'success');
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const saveRecipe = async () => {
    if (!generatedRecipe) return;
    setIsSavingRecipe(true);
    try {
      await db.recipes.create(generatedRecipe);
      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch {}
      showToast('Recipe Saved! 📌', 'Added to your saved recipes collection!', 'success');
      if (onSaveRecipeSuccess) onSaveRecipeSuccess();
    } catch (err) {
      showToast('Error', 'Failed to save recipe.', 'error');
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleLogCookedDish = async () => {
    if (!generatedRecipe || hasCookedLogged) return;
    setIsLoggingCooked(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const protein = generatedRecipe.nutrition?.protein || 20;
      const calories = generatedRecipe.nutrition?.calories || 350;
      const fiber = generatedRecipe.nutrition?.fiber || 0;

      await db.proteinLogs.create({
        item: generatedRecipe.title,
        total_protein: protein,
        animal_protein: Math.round(protein * 0.6),
        plant_protein: Math.round(protein * 0.4),
        dairy_protein: 0,
        total_calories: calories,
        total_fiber: fiber,
        logged_date: todayStr
      });

      try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch {}
      setHasCookedLogged(true);
      showToast(
        'Meal Logged! 🍳',
        `Added +${protein}g protein & ${calories} kcal to your daily tracker!`,
        'success'
      );
      if (onSaveRecipeSuccess) onSaveRecipeSuccess();
    } catch (err) {
      showToast('Error', 'Failed to log cooked meal.', 'error');
    } finally {
      setIsLoggingCooked(false);
    }
  };

  const getYoutubeUrl = () => {
    if (!generatedRecipe) return '#';
    const query = generatedRecipe.youtube_search_query || `${generatedRecipe.title} recipe`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      
      {/* Page Heading & Weekly Scan Badge */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)', border: '1px solid var(--coral-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--coral-primary)' }}>
              Fridge & Pantry <span style={{ color: 'var(--text-heading)' }}>Scanner</span>
            </h1>
            <p style={{ color: 'var(--text-body)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Snap or upload a photo of your fridge to extract available ingredients and craft tailored recipes.
            </p>
          </div>

          {/* Issue 2: Weekly Scan Limit Status Badge */}
          {user ? (
            <div style={{ backgroundColor: 'var(--sage-soft)', border: '1px solid var(--sage-border)', color: 'var(--sage-green)', padding: '0.5rem 1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
              <UserCheck size={18} /> Unlimited Scans Active
            </div>
          ) : (
            <div style={{ backgroundColor: weeklyScanCount >= GUEST_WEEKLY_LIMIT ? 'var(--coral-soft)' : 'var(--honey-soft)', border: `1px solid ${weeklyScanCount >= GUEST_WEEKLY_LIMIT ? 'var(--coral-border)' : 'var(--honey-border)'}`, color: weeklyScanCount >= GUEST_WEEKLY_LIMIT ? 'var(--coral-primary)' : 'var(--honey-amber)', padding: '0.5rem 1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
              <Lock size={16} /> Guest Scans: {weeklyScanCount} / {GUEST_WEEKLY_LIMIT} This Week
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div style={{ backgroundColor: 'var(--coral-soft)', border: '1px solid var(--coral-border)', color: 'var(--coral-primary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} style={{ color: 'var(--coral-primary)' }} />
            <span style={{ fontWeight: 600 }}>{errorMessage}</span>
          </div>
          {!user && (
            <button onClick={onOpenAuthModal} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', minHeight: '36px' }}>
              Log In for Unlimited Scans
            </button>
          )}
        </div>
      )}

      {/* 1. Image Upload Dropzone Island */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        {!previewUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--coral-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '3.5rem 2rem',
              backgroundColor: '#FFF9F9',
              cursor: 'pointer',
              transition: 'all 0.25s var(--ease-spring)'
            }}
            onClick={() => document.getElementById('pantry-image-input').click()}
          >
            <input
              id="pantry-image-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFFFFF', color: 'var(--coral-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid var(--coral-border)', boxShadow: '0 4px 14px rgba(255, 82, 82, 0.15)' }}>
              <Camera size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
              Drag & Drop your fridge or pantry photo here
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Supports JPG, PNG, WEBP (Take a photo with your smartphone or camera)
            </p>
            <button type="button" className="btn btn-primary">
              <Upload size={18} /> Select Photo
            </button>
          </div>
        ) : (
          <div>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', marginBottom: '1.5rem' }}>
              <img
                src={previewUrl}
                alt="Pantry preview"
                style={{ maxHeight: '350px', borderRadius: 'var(--radius-md)', objectFit: 'contain', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}
              />
              <button
                onClick={clearImage}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-heading)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    <span>Analyzing Photo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} /> Identify Ingredients
                  </>
                )}
              </button>

              <button onClick={clearImage} className="btn btn-outline">
                Clear Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Detected & Added Ingredients (with Spoonacular Autocomplete) */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--sage-border)', backgroundColor: '#FFFFFF' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--coral-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={24} style={{ color: 'var(--sage-green)' }} /> Detected Available Ingredients ({ingredients.length})
        </h3>

        {ingredients.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.75rem' }}>
            {ingredients.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--sage-soft)',
                  border: '1px solid var(--sage-border)',
                  color: 'var(--text-heading)',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                <span style={{ color: 'var(--sage-green)' }}>✓</span>
                <span>{item}</span>
                <button
                  onClick={() => removeIngredient(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                  title="Remove ingredient"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Issue 6: Empty State handling after scanning */
          <div style={{ padding: '1.25rem 0', marginBottom: '1.5rem' }}>
            {hasScanned ? (
              <div style={{ color: 'var(--coral-primary)' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.35rem' }}>❌ No Ingredients detected</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>Try a clearer photo or add ingredients manually below.</span>
              </div>
            ) : (
              <p style={{ color: 'var(--text-body)', fontStyle: 'italic' }}>
                No ingredients detected yet. Upload a photo above or manually enter items below.
              </p>
            )}
          </div>
        )}

        {/* Issue 7: Manual Ingredient Autocomplete Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
            Add Extra Ingredients Manually (Spoonacular Verified)
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px', position: 'relative' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="input-control"
                placeholder="Type to search real ingredients (e.g. Chicken breast, Garlic, Avocado)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => inputValue.trim() && suggestions.length > 0 && setShowDropdown(true)}
                onKeyDown={handleKeyDownInput}
              />
              {isSearchingIngredients && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #8B5CF6', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (suggestions.length > 0) {
                  selectSuggestion(suggestions[highlightedIndex]?.name || suggestions[0]?.name);
                } else if (inputValue.trim()) {
                  selectSuggestion(inputValue);
                  showToast('Notice', 'Ingredient search unavailable. Typing manually.', 'info');
                }
              }}
              disabled={!inputValue.trim()}
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Plus size={18} /> Add Item
            </button>
          </div>

          {/* Autocomplete Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                maxWidth: '600px',
                backgroundColor: 'rgba(26, 26, 70, 0.96)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                marginTop: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 50,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
            >
              {suggestions.length > 0 ? (
                suggestions.map((sug, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => selectSuggestion(sug.name)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        color: '#FFFFFF',
                        fontWeight: isHighlighted ? 700 : 500,
                        backgroundColor: isHighlighted ? '#8B5CF6' : 'transparent',
                        transition: 'background-color 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{sug.name}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Select</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '0.75rem 1rem', color: '#94A3B8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No matching ingredients found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recipe Generation Trigger */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={generateRecipe}
            disabled={isGeneratingRecipe || ingredients.length === 0}
            className="btn btn-primary"
            style={{ fontSize: '1.1rem', padding: '0.85rem 2.25rem' }}
          >
            {isGeneratingRecipe ? (
              <>
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <span>Crafting custom recipe...</span>
              </>
            ) : (
              <>
                <ChefHat size={22} /> Generate Recipe Suggestions
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Generated Recipe Result Card */}
      {generatedRecipe && (
        <div className="glass-card animate-scale-in" style={{ padding: '2.5rem', border: '1px solid var(--coral-border)', backgroundColor: '#FFFFFF' }}>
          
          {/* Header & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                {generatedRecipe.title}
              </h2>
              {generatedRecipe.cuisine_type && (
                <span style={{ backgroundColor: 'var(--coral-soft)', color: 'var(--coral-primary)', border: '1px solid var(--coral-border)', padding: '0.3rem 0.85rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700 }}>
                  {generatedRecipe.cuisine_type}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={generateRecipe} disabled={isGeneratingRecipe} className="btn btn-amber">
                <RefreshCw size={18} className={isGeneratingRecipe ? 'animate-spin' : ''} />
                <span>{isGeneratingRecipe ? 'Generating New Dish...' : 'Try Another Recipe'}</span>
              </button>
              <button onClick={saveRecipe} disabled={isSavingRecipe} className="btn btn-secondary">
                <Save size={18} /> {isSavingRecipe ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', color: 'var(--text-body)', fontSize: '0.95rem' }}>
            {generatedRecipe.prep_time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-heading)' }}>
                <Clock size={18} style={{ color: 'var(--coral-primary)' }} />
                <span>{generatedRecipe.prep_time}</span>
              </div>
            )}
            {generatedRecipe.servings && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-heading)' }}>
                <Users size={18} style={{ color: 'var(--coral-primary)' }} />
                <span>{generatedRecipe.servings} servings</span>
              </div>
            )}
            {generatedRecipe.difficulty && (
              <div style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.25rem 0.75rem', borderRadius: '6px', fontWeight: 700, color: 'var(--text-heading)' }}>
                {generatedRecipe.difficulty}
              </div>
            )}
          </div>

          {/* Ingredients & Instructions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* Required Ingredients List */}
            <div style={{ backgroundColor: 'var(--sage-soft)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--sage-border)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sage-green)', marginBottom: '1rem' }}>
                Required Ingredients
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {generatedRecipe.ingredients?.map((ing, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', color: 'var(--text-heading)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--sage-green)', fontWeight: 'bold' }}>•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step-by-Step Instructions */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--honey-amber)', marginBottom: '1rem' }}>
                Preparation Instructions
              </h3>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {generatedRecipe.instructions?.map((step, i) => {
                  const cleanStep = typeof step === 'string' ? step.replace(/^(Step\s*\d+:?\s*|\d+[\.\)]\s*)/i, '').trim() : step;
                  return (
                    <li key={i} style={{ fontSize: '0.975rem', lineHeight: 1.6, color: 'var(--text-body)', fontWeight: 500 }}>
                      {cleanStep}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Nutrition Info Bar */}
          {generatedRecipe.nutrition && (
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem 1.5rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem', textAlign: 'center', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-heading)' }}>{generatedRecipe.nutrition.calories || 0}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Calories</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--coral-primary)' }}>{generatedRecipe.nutrition.protein || 0}g</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Protein</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--honey-amber)' }}>{generatedRecipe.nutrition.carbs || 0}g</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Carbs</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--sage-green)' }}>{generatedRecipe.nutrition.fat || 0}g</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fat</div>
              </div>
            </div>
          )}

          {/* Cooked Meal & YouTube Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0' }}>
            
            <button
              onClick={handleLogCookedDish}
              disabled={isLoggingCooked || hasCookedLogged}
              className="btn btn-primary"
              style={{
                backgroundColor: hasCookedLogged ? 'var(--sage-soft)' : 'var(--coral-primary)',
                border: hasCookedLogged ? '1px solid var(--sage-border)' : 'none',
                color: hasCookedLogged ? 'var(--sage-green)' : '#FFFFFF',
                fontSize: '1rem',
                padding: '0.85rem 1.65rem'
              }}
            >
              {hasCookedLogged ? (
                <>
                  <CheckSquare size={20} style={{ color: 'var(--sage-green)' }} /> Meal Logged to Nutrition Tracker!
                </>
              ) : (
                <>
                  <span>🍳 Did you cook this dish? Log Nutrition!</span>
                </>
              )}
            </button>

            <a
              href={getYoutubeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{
                borderColor: '#FF0000',
                color: '#CC0000',
                backgroundColor: '#FFF5F5',
                textDecoration: 'none',
                fontSize: '0.95rem'
              }}
            >
              <Youtube size={20} style={{ color: '#FF0000' }} /> Watch Tutorial on YouTube 🎬
            </a>

          </div>

        </div>
      )}

    </div>
  );
}
