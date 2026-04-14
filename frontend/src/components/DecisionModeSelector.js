import React from 'react';
import './DecisionModeSelector.css';

const COLORS = ['#f97316','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];

export default function DecisionModeSelector({ mode, setMode, users, onBack, onResolve }) {
  return (
    <div className="mode-selector fade-in">
      <div className="mode-header">
        <h2 className="section-title" style={{ fontSize: '1.6rem' }}>
          🎛️ Choose Decision Mode
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: 4 }}>
          How should FairBite weigh each member's preferences?
        </p>
      </div>

      <div className="mode-cards">
        <div
          id="democracy-mode-card"
          className={`mode-card card ${mode === 'democracy' ? 'selected' : ''}`}
          onClick={() => setMode('democracy')}
        >
          <div className="mode-icon">🗳️</div>
          <h3 className="mode-title">Democracy Mode</h3>
          <p className="mode-desc">
            Every member has equal say. The algorithm finds the best option
            that maximizes collective satisfaction.
          </p>
          <div className="mode-tag">Equal Weights</div>
          {mode === 'democracy' && <div className="mode-check">✓</div>}
        </div>

        <div
          id="priority-mode-card"
          className={`mode-card card ${mode === 'priority' ? 'selected' : ''}`}
          onClick={() => setMode('priority')}
        >
          <div className="mode-icon">👑</div>
          <h3 className="mode-title">Priority Mode</h3>
          <p className="mode-desc">
            Members with higher importance scores have more influence. Use
            when some voices should carry more weight (e.g. birthday person).
          </p>
          <div className="mode-tag">Weighted Users</div>
          {mode === 'priority' && <div className="mode-check">✓</div>}
        </div>
      </div>

      {mode === 'priority' && (
        <div className="priority-weights card fade-in">
          <p className="section-title" style={{ fontSize: '1rem', marginBottom: 12 }}>
            👑 Set member importance (1 = normal, 5 = highest priority)
          </p>
          {users.map((u, i) => (
            <div key={u.id} className="priority-row">
              <div className="priority-avatar" style={{ background: u.color || COLORS[i % COLORS.length] }}>
                {u.name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="priority-name">{u.name}</span>
              <div className="priority-slider-wrap">
                <input
                  type="range" min="1" max="5" step="1"
                  value={u.globalWeight || 3}
                  onChange={e => {
                    // This is actually updated in parent via users state
                    // We need a setter here — will use a different approach
                  }}
                />
                <span className="priority-val">{u.globalWeight || 3}</span>
              </div>
            </div>
          ))}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>
            Tip: You can adjust individual weights in Step 1 (per-preference weights).
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="summary-card card">
        <p className="section-title" style={{ fontSize: '1rem', marginBottom: 12 }}>
          📋 Group Summary
        </p>
        <div className="summary-members">
          {users.map((u, i) => (
            <div key={u.id} className="summary-member">
              <div className="sm-avatar" style={{ background: u.color || COLORS[i % COLORS.length] }}>
                {u.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="sm-info">
                <strong>{u.name}</strong>
                <span>₹{u.budget} · {u.diet} · {u.cuisinePreference} · {u.spiceLevel} spice · {u.maxDistance}km</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mode-footer">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button id="resolve-btn" className="btn btn-primary btn-lg" onClick={onResolve}>
          🍽️ Resolve Conflict →
        </button>
      </div>
    </div>
  );
}
