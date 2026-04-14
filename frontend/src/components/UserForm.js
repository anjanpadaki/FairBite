import React, { useState } from 'react';
import './UserForm.css';

const CUISINES = ['any', 'Indian', 'Chinese', 'Italian', 'American', 'Japanese', 'Continental', 'Multi-Cuisine'];
const DIETS = ['any', 'veg', 'non-veg', 'vegan'];
const SPICES = ['any', 'mild', 'medium', 'spicy'];
const COLORS = ['#f97316','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];

const CITIES_DATA = {
  Bangalore: { Indiranagar: { lat: 12.9783, lng: 77.6408 }, Koramangala: { lat: 12.9279, lng: 77.6271 }, Whitefield: { lat: 12.9698, lng: 77.7499 }, Jayanagar: { lat: 12.9298, lng: 77.5800 } },
  Hyderabad: { 'Banjara Hills': { lat: 17.4156, lng: 78.4347 }, 'Jubilee Hills': { lat: 17.4300, lng: 78.4069 }, 'Hitec City': { lat: 17.4435, lng: 78.3772 }, Gachibowli: { lat: 17.4400, lng: 78.3489 } },
  Chennai: { 'T Nagar': { lat: 13.0418, lng: 80.2341 }, 'Anna Nagar': { lat: 13.0850, lng: 80.2101 }, Velachery: { lat: 12.9757, lng: 80.2212 }, Adyar: { lat: 13.0012, lng: 80.2565 } }
};

const defaultUser = () => ({
  id: `user_${Date.now()}`,
  name: '',
  budget: 300,
  cuisinePreference: 'any',
  diet: 'any',
  spiceLevel: 'any',
  maxDistance: 5,
  globalWeight: 3,
  weights: { budget: 3, cuisine: 3, diet: 3, spice: 2, distance: 2 },
  city: 'Bangalore',
  area: 'Indiranagar',
  lat: 12.9783,
  lng: 77.6408,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  expanded: true,
});

export default function UserForm({ users, setUsers, onNext }) {
  const [nlInput, setNlInput] = useState('');
  const [nlUserId, setNlUserId] = useState(null);

  const addUser = () => {
    const u = defaultUser();
    u.name = `Member ${users.length + 1}`;
    setUsers(prev => [...prev, u]);
  };

  const removeUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateUser = (id, field, value) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const updateWeight = (id, key, value) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, weights: { ...u.weights, [key]: Number(value) } } : u
    ));
  };

  const toggleExpand = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, expanded: !u.expanded } : u));
  };

  const handleCityChange = (id, newCity) => {
    const areas = Object.keys(CITIES_DATA[newCity]);
    const dArea = areas[0];
    const coords = CITIES_DATA[newCity][dArea];
    setUsers(prev => prev.map(u => u.id === id ? { ...u, city: newCity, area: dArea, lat: coords.lat, lng: coords.lng } : u));
  };

  const handleAreaChange = (id, city, newArea) => {
    const coords = CITIES_DATA[city][newArea];
    setUsers(prev => prev.map(u => u.id === id ? { ...u, area: newArea, lat: coords.lat, lng: coords.lng } : u));
  };

  // Simple NL parser (non-AI) — rule-based
  const parseNL = (text, id) => {
    const lower = text.toLowerCase();
    const patch = {};

    // Budget
    const budgetMatch = lower.match(/₹?\s*(\d+)\s*(?:rs|rupees?|budget)?/);
    if (budgetMatch) patch.budget = parseInt(budgetMatch[1]);
    if (lower.includes('cheap') || lower.includes('budget') || lower.includes('low cost')) patch.budget = Math.min(patch.budget || 200, 200);
    if (lower.includes('expensive') || lower.includes('fine dining') || lower.includes('premium')) patch.budget = Math.max(patch.budget || 800, 800);

    // Diet
    if (lower.includes('vegan')) patch.diet = 'vegan';
    else if (lower.includes('vegetarian') || lower.includes(' veg ') || lower.startsWith('veg')) patch.diet = 'veg';
    else if (lower.includes('non-veg') || lower.includes('nonveg') || lower.includes('chicken') || lower.includes('meat')) patch.diet = 'non-veg';

    // Spice
    if (lower.includes('spicy') || lower.includes('hot')) patch.spiceLevel = 'spicy';
    else if (lower.includes('mild') || lower.includes('not spicy')) patch.spiceLevel = 'mild';
    else if (lower.includes('medium spice') || lower.includes('moderate')) patch.spiceLevel = 'medium';

    // Cuisine
    const cuisineMap = { indian: 'Indian', chinese: 'Chinese', italian: 'Italian', american: 'American', japanese: 'Japanese', continental: 'Continental', 'multi-cuisine': 'Multi-Cuisine', multicuisine: 'Multi-Cuisine' };
    for (const [key, val] of Object.entries(cuisineMap)) {
      if (lower.includes(key)) { patch.cuisinePreference = val; break; }
    }

    // Distance
    const distMatch = lower.match(/(\d+)\s*km/);
    if (distMatch) patch.maxDistance = parseInt(distMatch[1]);
    if (lower.includes('nearby') || lower.includes('close')) patch.maxDistance = Math.min(patch.maxDistance || 2, 2);

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
    setNlInput('');
    setNlUserId(null);
  };

  const canProceed = users.length >= 1 && users.every(u => u.name.trim());

  return (
    <div className="user-form-wrap fade-in">
      <div className="user-form-header">
        <div>
          <h2 className="section-title" style={{ fontSize: '1.6rem', marginBottom: 6 }}>
            👥 Add Group Members
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Enter each person's food preferences. More conflict = smarter algorithm.
          </p>
        </div>
        <button id="add-member-btn" className="btn btn-primary" onClick={addUser}>
          + Add Member
        </button>
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🍕</div>
          <h3>No members yet</h3>
          <p>Add group members to start resolving food conflicts</p>
          <button className="btn btn-primary btn-lg" onClick={addUser}>Add First Member</button>
        </div>
      )}

      <div className="user-cards">
        {users.map((user, idx) => (
          <div key={user.id} className={`user-card card ${user.expanded ? 'expanded' : ''}`}
            style={{ '--user-color': user.color }}>

            <div className="user-card-header" onClick={() => toggleExpand(user.id)}>
              <div className="user-avatar" style={{ background: user.color }}>
                {user.name ? user.name[0].toUpperCase() : '?'}
              </div>
              <div className="user-card-title">
                <span className="user-name">{user.name || `Member ${idx + 1}`}</span>
                {!user.expanded && (
                  <span className="user-summary">
                    ₹{user.budget} · {user.diet} · {user.cuisinePreference} · {user.maxDistance}km
                  </span>
                )}
              </div>
              <div className="user-card-actions">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => { e.stopPropagation(); removeUser(user.id); }}
                  title="Remove member"
                >✕</button>
                <span className="expand-icon">{user.expanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {user.expanded && (
              <div className="user-card-body">
                {/* NL Input */}
                {nlUserId === user.id ? (
                  <div className="nl-input-wrap">
                    <input
                      className="form-input"
                      placeholder='e.g. "cheap spicy veg Indian food nearby"'
                      value={nlInput}
                      onChange={e => setNlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && parseNL(nlInput, user.id)}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => parseNL(nlInput, user.id)}>Parse →</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setNlUserId(null)}>Cancel</button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 6 }}>
                      Rule-based NL parser — no AI used ✅
                    </p>
                  </div>
                ) : (
                  <button className="btn btn-ghost btn-sm nl-trigger" onClick={() => setNlUserId(user.id)}>
                    💬 Type preference in natural language
                  </button>
                )}

                <div className="divider" />

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      id={`name-${user.id}`}
                      className="form-input"
                      placeholder="Enter name"
                      value={user.name}
                      onChange={e => updateUser(user.id, 'name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location (City)</label>
                    <select className="form-select" value={user.city} onChange={e => handleCityChange(user.id, e.target.value)}>
                      {Object.keys(CITIES_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Area</label>
                    <select className="form-select" value={user.area} onChange={e => handleAreaChange(user.id, user.city, e.target.value)}>
                      {Object.keys(CITIES_DATA[user.city]).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Budget (₹): {user.budget}</label>
                    <input
                      type="range" min="100" max="1500" step="50"
                      value={user.budget}
                      onChange={e => updateUser(user.id, 'budget', Number(e.target.value))}
                    />
                    <div className="range-labels">
                      <span>₹100</span><span>₹1500</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cuisine</label>
                    <select id={`cuisine-${user.id}`} className="form-select"
                      value={user.cuisinePreference}
                      onChange={e => updateUser(user.id, 'cuisinePreference', e.target.value)}>
                      {CUISINES.map(c => <option key={c} value={c}>{c === 'any' ? 'Any Cuisine' : c}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Diet</label>
                    <select id={`diet-${user.id}`} className="form-select"
                      value={user.diet}
                      onChange={e => updateUser(user.id, 'diet', e.target.value)}>
                      {DIETS.map(d => <option key={d} value={d}>{d === 'any' ? 'No restriction' : d}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Spice Preference</label>
                    <div className="spice-buttons">
                      {SPICES.map(s => (
                        <button key={s}
                          className={`spice-btn ${user.spiceLevel === s ? 'active' : ''}`}
                          onClick={() => updateUser(user.id, 'spiceLevel', s)}>
                          {s === 'any' ? '🌀 Any' : s === 'mild' ? '🟢 Mild' : s === 'medium' ? '🟡 Medium' : '🔴 Spicy'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Distance: {user.maxDistance} km</label>
                    <input
                      type="range" min="1" max="20" step="0.5"
                      value={user.maxDistance}
                      onChange={e => updateUser(user.id, 'maxDistance', Number(e.target.value))}
                    />
                    <div className="range-labels">
                      <span>1 km</span><span>20 km</span>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <div className="weights-section">
                  <p className="section-title" style={{ fontSize: '0.95rem', marginBottom: 12 }}>
                    ⚖️ Preference Weights (1–5)
                  </p>
                  <div className="weight-grid">
                    {Object.entries(user.weights).map(([key, val]) => (
                      <div key={key} className="form-group">
                        <label className="form-label">{key.charAt(0).toUpperCase() + key.slice(1)}: {val}</label>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={val}
                          onChange={e => updateWeight(user.id, key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {users.length > 0 && (
        <div className="form-footer">
          <button
            id="next-step-btn"
            className="btn btn-primary btn-lg"
            onClick={onNext}
            disabled={!canProceed}
          >
            Next: Choose Mode →
          </button>
          {!canProceed && (
            <p className="help-text">Please fill in names for all members</p>
          )}
        </div>
      )}
    </div>
  );
}
