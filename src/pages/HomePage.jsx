import React from 'react';
import { Camera, Utensils, Flame, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, HeartPulse, ChefHat, Clock, AlertCircle } from 'lucide-react';

export default function HomePage({ onNavigate, stats = {} }) {
  const { recipeCount = 0, todayProtein = 0, proteinGoal = 80 } = stats;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem 4rem 1.5rem' }}>
      
      {/* 1. HERO SECTION (Editorial Ledger Vibe + Popping Neubrutalism Typography) */}
      <section style={{ padding: '3.5rem 0 3.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '3rem',
            alignItems: 'center'
          }}
        >
          {/* Hero Left: Popping Typography & Actions */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--pine)',
                backgroundColor: 'var(--paper-deep)',
                border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0px var(--ink)',
                padding: '0.35rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Sparkles size={16} color="var(--gold-dark)" />
              <span>FOR KITCHENS THAT HATE WASTE</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.7rem, 5.5vw, 4.2rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.025em',
                marginBottom: '1.25rem',
                color: 'var(--ink)'
              }}
            >
              Know what's in your <span className="highlight-gold">kitchen</span> before you open the fridge
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--ink-soft)',
                lineHeight: 1.65,
                maxWidth: '46ch',
                marginBottom: '2rem',
                fontWeight: 500
              }}
            >
              Scan your shelves, track what's about to turn, and get recipes built from what you already own — no more forgotten spinach at the back of the drawer.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
              <button
                onClick={() => onNavigate('analyze')}
                className="btn btn-gold btn-lg"
              >
                <Camera size={20} />
                <span>Start Your Pantry</span>
              </button>
              <button
                onClick={() => onNavigate('recipes')}
                className="btn btn-outline btn-lg"
              >
                <Utensils size={20} />
                <span>Browse Saved Recipes</span>
              </button>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: 'var(--ink-soft)',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--card)',
                padding: '6px 12px',
                border: '1.5px solid var(--ink)',
                borderRadius: '6px'
              }}
            >
              <CheckCircle2 size={16} color="var(--sage)" />
              <span>Free for your kitchen shelves · No card required</span>
            </div>
          </div>

          {/* Hero Right: The Iconic Pantry Shelf Visualizer (From Ledger Prototype) */}
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, var(--pine-light) 0%, var(--pine) 100%)',
              border: 'var(--border-thicker)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-hard-xl)',
              padding: '2rem 1.75rem',
              minHeight: '430px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transform: 'rotate(1deg)',
              transition: 'transform 0.25s ease'
            }}
          >
            {/* Live scanning pill badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(20, 32, 21, 0.75)',
                color: '#FAF6E9',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: '20px',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#4ADE80',
                  boxShadow: '0 0 8px #4ADE80'
                }}
              />
              <span>SCANNING SHELF 2 OF 3</span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {/* Shelf Row 1: Dry Goods & Grains */}
              <div className="shelf-row">
                <div className="shelf-rule"></div>
                <div className="shelf-tags">
                  <div className="shelf-tag">
                    <div className="tag-name">Basmati Rice</div>
                    <div className="tag-qty">1.2 kg</div>
                  </div>
                  <div className="shelf-tag">
                    <div className="tag-name">Rolled Oats</div>
                    <div className="tag-qty">900 g</div>
                  </div>
                  <div className="shelf-tag">
                    <div className="tag-name">Quinoa</div>
                    <div className="tag-qty">400 g</div>
                  </div>
                </div>
              </div>

              {/* Shelf Row 2: Fresh Produce */}
              <div className="shelf-row">
                <div className="shelf-rule"></div>
                <div className="shelf-tags">
                  <div className="shelf-tag" style={{ backgroundColor: '#FEE2E2', borderColor: 'var(--rust)' }}>
                    <div className="tag-name" style={{ color: 'var(--rust-dark)' }}>Baby Spinach</div>
                    <div className="tag-qty" style={{ color: 'var(--rust)', fontWeight: 700 }}>2d left!</div>
                  </div>
                  <div className="shelf-tag">
                    <div className="tag-name">Red Onions</div>
                    <div className="tag-qty">×4 count</div>
                  </div>
                  <div className="shelf-tag">
                    <div className="tag-name">Garlic Bulbs</div>
                    <div className="tag-qty">×2 count</div>
                  </div>
                </div>
              </div>

              {/* Shelf Row 3: Dairy & Protein */}
              <div className="shelf-row">
                <div className="shelf-rule"></div>
                <div className="shelf-tags">
                  <div className="shelf-tag" style={{ backgroundColor: '#FEF9C3' }}>
                    <div className="tag-name">Fresh Paneer</div>
                    <div className="tag-qty">250 g</div>
                  </div>
                  <div className="shelf-tag">
                    <div className="tag-name">Greek Yogurt</div>
                    <div className="tag-qty">450 g</div>
                  </div>
                  <div className="shelf-tag">
                    <div className="tag-name">Pasture Eggs</div>
                    <div className="tag-qty">6 pack</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shelf bottom status */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#C5D2BA',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem'
              }}
            >
              <span>9 items catalogued</span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Pantry Status: Fresh</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NEUBRUTALIST ANIMATED MARQUEE TICKER */}
      <div
        className="marquee-ribbon"
        style={{
          margin: '2rem -1.5rem 3.5rem',
          transform: 'rotate(-1deg)',
          backgroundColor: 'var(--pine)',
          boxShadow: '0 6px 0 var(--ink)'
        }}
      >
        <div className="marquee-content">
          <span>SCAN SHELVES · COOK SMART · TRACK NUTRITION · NO FORGOTTEN SPINACH · SAVE GROCERY BILLS · ZERO FOOD WASTE ·</span>
          <span>SCAN SHELVES · COOK SMART · TRACK NUTRITION · NO FORGOTTEN SPINACH · SAVE GROCERY BILLS · ZERO FOOD WASTE ·</span>
        </div>
      </div>

      {/* 3. STATS BAND (High-Contrast Tilted Neubrutalist Metric Cards) */}
      <section style={{ marginBottom: '4.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem'
          }}
        >
          {/* Stat 1 */}
          <div
            className="ledger-card"
            style={{
              backgroundColor: '#FEF9C3',
              transform: 'rotate(-1.5deg)',
              textAlign: 'center',
              padding: '2.25rem 1.5rem'
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1, marginBottom: '0.5rem' }}>
              38%
            </div>
            <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink)' }}>
              Less Food Thrown Out
            </div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Home cooks save an average of $120 monthly on wasted produce.
            </p>
          </div>

          {/* Stat 2 */}
          <div
            className="ledger-card"
            style={{
              backgroundColor: '#DCFCE7',
              transform: 'rotate(1.5deg)',
              textAlign: 'center',
              padding: '2.25rem 1.5rem'
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1, marginBottom: '0.5rem' }}>
              4.2s
            </div>
            <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink)' }}>
              To Scan & Log a Shelf
            </div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Fast vision detection extracts ingredients without manual typing.
            </p>
          </div>

          {/* Stat 3 */}
          <div
            className="ledger-card"
            style={{
              backgroundColor: '#FEE2E2',
              transform: 'rotate(-1deg)',
              textAlign: 'center',
              padding: '2.25rem 1.5rem'
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1, marginBottom: '0.5rem' }}>
              12,400+
            </div>
            <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink)' }}>
              Kitchen Meals Cooked
            </div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Personalized recipes generated directly from available stock.
            </p>
          </div>
        </div>
      </section>

      {/* 4. THREE TOOLS, ONE RUNNING LIST (Feature Rows from Ledger Prototype) */}
      <section style={{ marginBottom: '5rem' }}>
        <div style={{ maxWidth: '680px', marginBottom: '2.5rem' }}>
          <div className="mono" style={{ color: 'var(--sage)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            What PantryPal Does
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 2.75rem)', marginBottom: '0.75rem' }}>
            Three tools, one running list of what's actually in your kitchen
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Everything syncs with the same kitchen ledger — snap once, and your recipe engine and calorie tracker both know what you have ready.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Feature 1: Pantry Vision Scanner */}
          <div
            className="ledger-card"
            style={{
              padding: '2.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: 'var(--gold-soft)', border: '2px solid var(--ink)', boxShadow: '2px 2px 0px var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={24} color="var(--ink)" />
                </div>
                <div>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-faint)' }}>TOOL 01</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Pantry Vision Scanner</h3>
                </div>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Point your camera at a shelf, drawer or grocery haul. PantryPal reads labels and quantities and organizes them into your pantry inventory in seconds.
              </p>
              <button onClick={() => onNavigate('analyze')} className="btn btn-gold">
                <span>Open Vision Scanner</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--paper-deep)',
                border: '2px dashed var(--ink)',
                borderRadius: '10px',
                padding: '1.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: 'var(--ink)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontWeight: 700 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--sage)' }}></span>
                <span>Visual Detection Preview:</span>
              </div>
              <div style={{ backgroundColor: 'var(--card)', padding: '0.75rem', borderRadius: '6px', border: '1.5px solid var(--ink)', marginBottom: '0.5rem' }}>
                📸 7 items detected · Sorted into 3 shelves
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                Items automatically cross-referenced with your culinary profile.
              </div>
            </div>
          </div>

          {/* Feature 2: Recipe Generator */}
          <div
            className="ledger-card"
            style={{
              padding: '2.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: 'var(--sage-soft)', border: '2px solid var(--ink)', boxShadow: '2px 2px 0px var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChefHat size={24} color="var(--sage)" />
                </div>
                <div>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-faint)' }}>TOOL 02</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Custom Recipe Generator</h3>
                </div>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Get chef-grade recipes crafted from what's actually in your kitchen right now, ranked by expiring ingredients to prevent food waste.
              </p>
              <button onClick={() => onNavigate('recipes')} className="btn btn-secondary">
                <span>Explore Recipes ({recipeCount})</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--paper-deep)',
                border: '2px dashed var(--ink)',
                borderRadius: '10px',
                padding: '1.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: 'var(--ink)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontWeight: 700 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--gold)' }}></span>
                <span>Zero-Waste Recipe Match:</span>
              </div>
              <div style={{ backgroundColor: 'var(--card)', padding: '0.75rem', borderRadius: '6px', border: '1.5px solid var(--ink)', marginBottom: '0.5rem' }}>
                🍲 Garlic Spinach Paneer Skillet · 8/9 ingredients ready
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                Prioritizes spinach expiring in 2 days.
              </div>
            </div>
          </div>

          {/* Feature 3: Calorie & Macro Tracker */}
          <div
            className="ledger-card"
            style={{
              padding: '2.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: 'var(--rust-soft)', border: '2px solid var(--ink)', boxShadow: '2px 2px 0px var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={24} color="var(--rust)" />
                </div>
                <div>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-faint)' }}>TOOL 03</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Calorie & Protein Tracker</h3>
                </div>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Every meal you cook from PantryPal logs itself, with calories, protein, and macros calculated against your daily target in one click.
              </p>
              <button onClick={() => onNavigate('calories')} className="btn btn-rust">
                <span>Scan Meal Nutrition</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--paper-deep)',
                border: '2px dashed var(--ink)',
                borderRadius: '10px',
                padding: '1.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: 'var(--ink)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontWeight: 700 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--rust)' }}></span>
                <span>Daily Nutrition Target:</span>
              </div>
              <div style={{ backgroundColor: 'var(--card)', padding: '0.75rem', borderRadius: '6px', border: '1.5px solid var(--ink)', marginBottom: '0.5rem' }}>
                ⚡ {todayProtein}g / {proteinGoal}g Protein Logged Today
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                Automated macro estimation with no manual calorie guesswork.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. HOW IT WORKS (Three Steps from Shelf to Dinner) */}
      <section
        style={{
          backgroundColor: 'var(--paper-deep)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hard-lg)',
          padding: '3.5rem 2.5rem',
          marginBottom: '5rem'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
          <div className="mono" style={{ color: 'var(--pine)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Workflow
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginBottom: '0.5rem' }}>
            From shelf to dinner in three steps
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '1rem' }}>
            No tedious item typing. Your camera and kitchen inventory handle the work.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem'
          }}
        >
          {/* Step 1 */}
          <div
            className="ledger-card"
            style={{
              padding: '2rem',
              transform: 'rotate(-1deg)'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--gold)',
                border: '2px solid var(--ink)',
                boxShadow: '3px 3px 0px var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.4rem',
                marginBottom: '1.25rem'
              }}
            >
              01
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Scan your shelves
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Open your camera and snap your fridge, pantry shelf or grocery bag. Ingredients are recognized automatically.
            </p>
          </div>

          {/* Step 2 */}
          <div
            className="ledger-card"
            style={{
              padding: '2rem',
              transform: 'rotate(1deg)'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--sage)',
                color: '#FFFDF8',
                border: '2px solid var(--ink)',
                boxShadow: '3px 3px 0px var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.4rem',
                marginBottom: '1.25rem'
              }}
            >
              02
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Review what's found
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Confirm your detected ingredients list, add missing staples in one tap, and organize them into your active pantry.
            </p>
          </div>

          {/* Step 3 */}
          <div
            className="ledger-card"
            style={{
              padding: '2rem',
              transform: 'rotate(-1.5deg)'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--rust)',
                color: '#FFFDF8',
                border: '2px solid var(--ink)',
                boxShadow: '3px 3px 0px var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.4rem',
                marginBottom: '1.25rem'
              }}
            >
              03
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Cook what it suggests
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Generate custom recipes built specifically around ingredients closest to expiration, and log your dinner in one click.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BAND */}
      <section
        style={{
          textAlign: 'center',
          padding: '4rem 1.5rem',
          backgroundColor: 'var(--card)',
          border: 'var(--border-thicker)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hard-xl)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
              marginBottom: '1rem',
              lineHeight: 1.15
            }}
          >
            Stop guessing what's in the fridge
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--ink-soft)', marginBottom: '2rem' }}>
            Scan your first shelf in under a minute. No credit card, no complex setup required.
          </p>
          <button
            onClick={() => onNavigate('analyze')}
            className="btn btn-gold btn-lg"
          >
            <Camera size={22} />
            <span>Start Your Pantry Now</span>
          </button>
        </div>
      </section>

    </div>
  );
}
