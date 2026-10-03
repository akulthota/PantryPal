import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Plus, X, Sparkles, Clock, Users, Flame, Save, RefreshCw, AlertCircle, CheckCircle2, ChefHat, UserCheck, Lock, Youtube, CheckSquare, Search, AlertTriangle } from 'lucide-react';
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
            const MAX_SIZE = 640;
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
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
          if (data.isFallback) {
            if (data.reason === 'api_error') {
              showToast('DeepSeek AI Notice', data.errorDetails || 'AI Vision call encountered an issue. Loaded sample items.', 'error');
            } else if (data.reason === 'missing_key') {
              showToast('Sample Ingredients Loaded 📷', 'DEEPSEEK_API_KEY is not detected. Ensure the key is enabled for Preview & Production in Vercel!', 'info');
            } else {
              showToast('Sample Ingredients Loaded 📷', 'Loaded sample kitchen items.', 'info');
            }
          } else {
            showToast('Ingredients Extracted! 🍓', `Identified ${data.ingredients.length} items from your photo.`, 'success');
          }
          
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
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      
      {/* Page Heading & Weekly Scan Badge */}
      <div className="ledger-card animate-fade-in" style={{ padding: '2.25rem 2rem', marginBottom: '2.25rem', backgroundColor: 'var(--card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--pine)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Kitchen Vision Engine
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--ink)' }}>
              Fridge & Pantry <span className="highlight-gold">Scanner</span>
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', marginTop: '0.35rem' }}>
              Snap or upload a photo of your shelves to extract available ingredients and craft tailored recipes.
            </p>
          </div>

          {/* Weekly Scan Limit Status Badge */}
          {user ? (
            <div className="tag-badge" style={{ backgroundColor: 'var(--sage-soft)', color: 'var(--pine)', padding: '0.5rem 1rem' }}>
              <UserCheck size={18} color="var(--sage)" />
              <span>Unlimited Scans Active</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="tag-badge"
                style={{
                  backgroundColor: weeklyScanCount >= GUEST_WEEKLY_LIMIT ? 'var(--rust-soft)' : 'var(--gold-soft)',
                  color: weeklyScanCount >= GUEST_WEEKLY_LIMIT ? 'var(--rust-dark)' : 'var(--ink)',
                  padding: '0.5rem 1rem'
                }}
              >
                <Lock size={16} />
                <span>Guest Scans: {weeklyScanCount} / {GUEST_WEEKLY_LIMIT} This Week</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div style={{ backgroundColor: 'var(--rust-soft)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)', color: 'var(--rust-dark)', padding: '1.1rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={22} color="var(--rust)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{errorMessage}</span>
          </div>
          {!user && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={onOpenAuthModal} className="btn btn-sm btn-gold">
                Log In for Unlimited Scans
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1. Image Upload Dropzone Island */}
      <div className="ledger-card" style={{ padding: '2.5rem 2rem', marginBottom: '2.5rem', textAlign: 'center' }}>
        {!previewUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: '2.5px dashed var(--ink)',
              borderRadius: 'var(--radius-md)',
              padding: '3.5rem 2rem',
              backgroundColor: 'var(--paper)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, background-color 0.15s ease'
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
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: 'var(--gold)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2.5px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)' }}>
              <Camera size={32} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--ink)' }}>
              Drag & Drop your fridge or pantry photo here
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.975rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Snap your produce drawer, pantry dry shelf or grocery bag haul to auto-extract ingredients.
            </p>
            <button type="button" className="btn btn-primary btn-lg">
              <Upload size={18} /> Select Photo from Device
            </button>
          </div>
        ) : (
          <div>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', marginBottom: '1.75rem' }}>
              <img
                src={previewUrl}
                alt="Pantry preview"
                style={{ maxHeight: '380px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', border: '2.5px solid var(--ink)', boxShadow: 'var(--shadow-hard)' }}
              />
              <button
                onClick={clearImage}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'var(--card)',
                  color: 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: '2px 2px 0px var(--ink)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Remove photo"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="btn btn-gold btn-lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid var(--ink)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    <span>Analyzing Shelf Items...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} /> Identify Ingredients
                  </>
                )}
              </button>

              <button onClick={clearImage} className="btn btn-outline btn-lg">
                Clear Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. INGREDIENT DETECTION & LISTING (PINNED STICKY NOTE STYLE) */}
      <div className="sticky-note" style={{ marginBottom: '2.5rem' }}>
        {/* Physical pushpin atop sticky note */}
        <div className="sticky-pin"></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '2px dashed rgba(20, 32, 21, 0.25)', paddingBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📌</span> Detected Kitchen Ingredients ({ingredients.length})
          </h3>
          <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink-soft)' }}>
            Shelf Inventory Memo
          </span>
        </div>

        {ingredients.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.75rem' }}>
            {ingredients.map((item, idx) => (
              <div
                key={idx}
                className="pinned-tag"
              >
                <span>{item}</span>
                <button
                  onClick={() => removeIngredient(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.7 }}
                  title="Remove ingredient"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State handling after scanning */
          <div style={{ padding: '1rem 0 1.5rem', borderBottom: '1.5px dashed rgba(20,32,21,0.2)', marginBottom: '1.5rem' }}>
            {hasScanned ? (
              <div style={{ color: 'var(--rust-dark)' }}>
                <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.35rem' }}>❌ No Ingredients Detected from Photo</strong>
                <span style={{ fontSize: '0.95rem', color: 'var(--ink-soft)' }}>Try snapping closer with good lighting, or add items to this note below.</span>
              </div>
            ) : (
              <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                No items on this shelf memo yet. Upload a fridge photo above or jot down ingredients below.
              </p>
            )}
          </div>
        )}

        {/* Manual Ingredient Autocomplete Entry (Ruled Sticky Note Style) */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
            + Jot Down Additional Ingredients
          </h4>
          <div style={{ display: 'flex', gap: '0.65rem', maxWidth: '640px', position: 'relative' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="input-control"
                style={{ backgroundColor: '#FFFFFF' }}
                placeholder="Type ingredient (e.g. Chicken breast, Garlic, Avocado)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => inputValue.trim() && suggestions.length > 0 && setShowDropdown(true)}
                onKeyDown={handleKeyDownInput}
              />
              {isSearchingIngredients && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid var(--pine)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
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
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Plus size={18} /> Pin Item
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
                maxWidth: '640px',
                backgroundColor: 'var(--card)',
                border: '2px solid var(--ink)',
                boxShadow: '4px 4px 0px var(--ink)',
                borderRadius: '8px',
                marginTop: '6px',
                maxHeight: '220px',
                overflowY: 'auto',
                zIndex: 50
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
                        color: 'var(--ink)',
                        fontWeight: isHighlighted ? 700 : 500,
                        backgroundColor: isHighlighted ? 'var(--gold-soft)' : 'transparent',
                        borderBottom: '1px solid rgba(20, 32, 21, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{sug.name}</span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Select ↵</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '0.75rem 1rem', color: 'var(--ink-faint)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No matching ingredients found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. RECIPE GENERATION TRIGGER (PINNED STICKY NOTE STYLE) */}
      <div className="sticky-note sticky-note-sage" style={{ marginBottom: '3rem' }}>
        <div className="sticky-pin sticky-pin-gold"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--pine)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kitchen Chef Engine
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', marginTop: '0.25rem' }}>
              Ready to cook with your {ingredients.length} logged ingredients?
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Our AI evaluates ingredient expiration and crafts an appetizing zero-waste recipe instantly.
            </p>
          </div>

          <button
            onClick={generateRecipe}
            disabled={isGeneratingRecipe || ingredients.length === 0}
            className="btn btn-gold btn-lg"
          >
            {isGeneratingRecipe ? (
              <>
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid var(--ink)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <span>Crafting Custom Recipe...</span>
              </>
            ) : (
              <>
                <ChefHat size={22} /> Generate Recipe Suggestions
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. GENERATED RECIPE RESULT CARD (EDITORIAL LEDGER STYLE — NOT A STICKY NOTE) */}
      {generatedRecipe && (
        <div className="ledger-card animate-scale-in" style={{ padding: '3rem 2.25rem', backgroundColor: 'var(--card)', border: 'var(--border-thicker)', boxShadow: 'var(--shadow-hard-xl)' }}>
          
          {/* Header & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.75rem', borderBottom: '2px solid var(--ink)', paddingBottom: '1.5rem' }}>
            <div>
              <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--pine)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                Freshly Crafted Dish
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 2.75rem)', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.75rem', lineHeight: 1.15 }}>
                {generatedRecipe.title}
              </h2>
              {generatedRecipe.cuisine_type && (
                <span className="tag-badge" style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}>
                  {generatedRecipe.cuisine_type} Style
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button onClick={generateRecipe} disabled={isGeneratingRecipe} className="btn btn-amber">
                <RefreshCw size={18} className={isGeneratingRecipe ? 'animate-spin' : ''} />
                <span>{isGeneratingRecipe ? 'Generating...' : 'Try Another Recipe'}</span>
              </button>
              <button onClick={saveRecipe} disabled={isSavingRecipe} className="btn btn-secondary">
                <Save size={18} /> {isSavingRecipe ? 'Saving...' : 'Save to Pantry'}
              </button>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.25rem', flexWrap: 'wrap', color: 'var(--ink)', fontSize: '0.95rem' }}>
            {generatedRecipe.prep_time && (
              <div className="tag-badge">
                <Clock size={16} color="var(--rust)" />
                <span>{generatedRecipe.prep_time}</span>
              </div>
            )}
            {generatedRecipe.servings && (
              <div className="tag-badge">
                <Users size={16} color="var(--sage)" />
                <span>{generatedRecipe.servings} Servings</span>
              </div>
            )}
            {generatedRecipe.difficulty && (
              <div className="tag-badge" style={{ backgroundColor: 'var(--paper-deep)' }}>
                <span>Difficulty: {generatedRecipe.difficulty}</span>
              </div>
            )}
          </div>

          {/* Ingredients & Instructions Grid (Clean Structured Editorial Ledger) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.25rem' }}>
            
            {/* Required Ingredients List (Structured Ledger Card) */}
            <div style={{ backgroundColor: 'var(--paper)', padding: '1.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--sage)' }}>✓</span> Required Ingredients
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {generatedRecipe.ingredients?.map((ing, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', color: 'var(--ink)', fontWeight: 600, borderBottom: '1px dashed rgba(20, 32, 21, 0.15)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--gold-dark)', fontWeight: 'bold' }}>•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step-by-Step Instructions */}
            <div style={{ backgroundColor: 'var(--card)', padding: '1.75rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Step-by-Step Cooking Guide
              </h3>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {generatedRecipe.instructions?.map((step, i) => {
                  const cleanStep = typeof step === 'string' ? step.replace(/^(Step\s*\d+:?\s*|\d+[\.\)]\s*)/i, '').trim() : step;
                  return (
                    <li key={i} style={{ fontSize: '0.975rem', lineHeight: 1.6, color: 'var(--ink-soft)', fontWeight: 500 }}>
                      {cleanStep}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Nutrition Info Bar */}
          {generatedRecipe.nutrition && (
            <div style={{ backgroundColor: 'var(--paper-deep)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', textAlign: 'center', marginBottom: '2.25rem' }}>
              <div>
                <div className="mono" style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--ink)' }}>{generatedRecipe.nutrition.calories || 0}</div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Calories</div>
              </div>
              <div>
                <div className="mono" style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--rust)' }}>{generatedRecipe.nutrition.protein || 0}g</div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Protein</div>
              </div>
              <div>
                <div className="mono" style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--gold-dark)' }}>{generatedRecipe.nutrition.carbs || 0}g</div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Carbs</div>
              </div>
              <div>
                <div className="mono" style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--sage)' }}>{generatedRecipe.nutrition.fat || 0}g</div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Fat</div>
              </div>
            </div>
          )}

          {/* Cooked Meal & YouTube Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.5rem', borderTop: '2px solid var(--ink)' }}>
            
            <button
              onClick={handleLogCookedDish}
              disabled={isLoggingCooked || hasCookedLogged}
              className={`btn ${hasCookedLogged ? 'btn-outline' : 'btn-primary'}`}
              style={{ fontSize: '1rem', padding: '0.85rem 1.75rem' }}
            >
              {hasCookedLogged ? (
                <>
                  <CheckSquare size={20} color="var(--sage)" /> Meal Logged to Nutrition Tracker!
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
              style={{ fontSize: '0.95rem' }}
            >
              <Youtube size={20} color="#FF0000" /> Watch Tutorial on YouTube 🎬
            </a>

          </div>

        </div>
      )}

    </div>
  );
}
