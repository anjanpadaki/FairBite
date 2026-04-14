import React, { useState, useEffect } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend
} from 'recharts';
import './ResultDashboard.css';

const CONFLICT_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const USER_COLORS = ['#f97316','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];

const SCORE_COLOR = (score) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

function AnimatedScore({ value, color }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(Math.round(start));
    }, 25);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="animated-score" style={{ color }}>
      {displayed}
    </span>
  );
}

function ScoreBar({ label, value, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(value), 200); }, [value]);

  return (
    <div className="score-bar-wrap">
      <div className="score-bar-label">
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function ResultDashboard({ result, onReset }) {
  const { selected, alternatives, conflict, compromiseSuggestions, users, mode, noMatch, noMatchMessage } = result;
  const [activeTab, setActiveTab] = useState('overview');

  // Prepare radar chart data for breakdown of selected restaurant
  const radarData = selected.userBreakdowns
    ? Object.entries(Object.values(selected.userBreakdowns)[0] || {}).map(([dim]) => {
        const entry = { subject: dim.charAt(0).toUpperCase() + dim.slice(1) };
        users.forEach((u, i) => {
          entry[u.name] = selected.userBreakdowns[u.id]?.[dim] || 0;
        });
        return entry;
      })
    : [];

  // Bar chart data
  const barData = users.map((u, i) => ({
    name: u.name,
    score: Math.round(selected.userScores[u.id] || 0),
    color: USER_COLORS[i % USER_COLORS.length],
  }));

  return (
    <div className="result-dashboard fade-in">

      {/* No match banner */}
      {noMatch && (
        <div className="no-match-banner">
          ⚠️ {noMatchMessage}
        </div>
      )}

      {/* Conflict badge */}
      <div className="conflict-strip" style={{ '--c-color': CONFLICT_COLORS[conflict.intensity] }}>
        <div className="conflict-label">
          Conflict Intensity
          <span className={`badge badge-${conflict.intensity}`}>
            {conflict.intensity === 'high' ? '🔴' : conflict.intensity === 'medium' ? '🟡' : '🟢'} {conflict.intensity.toUpperCase()}
          </span>
        </div>
        <div className="conflict-details">
          {conflict.conflicts.map((c, i) => (
            <span key={i} className="conflict-chip">{c.detail}</span>
          ))}
          {conflict.conflicts.length === 0 && <span className="conflict-chip">No conflicts — great alignment!</span>}
        </div>
      </div>

      {/* WINNER CARD */}
      <div className="winner-card card glow-primary">
        <div className="winner-badge">🏆 Best Match</div>
        <div className="winner-main">
          <div className="winner-info">
            <h2 className="winner-name">{selected.restaurant.name}</h2>
            <div className="winner-meta">
              <span className="meta-chip">🍽️ {selected.restaurant.cuisine}</span>
              <span className="meta-chip">₹{selected.restaurant.avgBudget} avg</span>
              <span className="meta-chip">📍 {selected.restaurant.distance}km</span>
              <span className="meta-chip">⭐ {selected.restaurant.rating}</span>
              <span className="meta-chip">🌶️ {selected.restaurant.spiceLevel}</span>
              {selected.restaurant.dietOptions?.map(d => (
                <span key={d} className="meta-chip diet-chip">{d}</span>
              ))}
            </div>
            {selected.restaurant.tags?.length > 0 && (
              <div className="winner-tags">
                {selected.restaurant.tags.map(t => (
                  <span key={t} className="tag">#{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="winner-scores-col">
            <div className="big-score-block">
              <div className="big-score-label">Aggregate Score</div>
              <div className="big-score-value">
                <AnimatedScore value={selected.aggregateScore} color={SCORE_COLOR(selected.aggregateScore)} />
                <span className="big-score-max">/100</span>
              </div>
            </div>
            <div className="big-score-block">
              <div className="big-score-label">Fairness Index</div>
              <div className="big-score-value">
                <AnimatedScore value={selected.fairnessIndex} color="#8b5cf6" />
                <span className="big-score-max">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {['overview', 'analysis', 'explanation', 'logistics', 'alternatives'].map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? '📊 Overview' :
             tab === 'analysis' ? '🔬 Analysis' :
             tab === 'explanation' ? '🧾 Reasoning' : 
             tab === 'logistics' ? '🚆 Travel' : '🔁 Alternatives'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="tab-content fade-in">
          <div className="overview-grid">
            {/* Individual scores */}
            <div className="card">
              <p className="section-title">📈 Individual Satisfaction</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {users.map((u, i) => {
                  const score = Math.round(selected.userScores[u.id] || 0);
                  return (
                    <div key={u.id} className="user-score-row">
                      <div className="user-score-avatar" style={{ background: USER_COLORS[i % USER_COLORS.length] }}>
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <ScoreBar label={u.name} value={score} color={SCORE_COLOR(score)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bar chart */}
            <div className="card">
              <p className="section-title">📊 Score Comparison</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compromise suggestions */}
          {compromiseSuggestions?.length > 0 && (
            <div className="card compromise-card">
              <p className="section-title">💡 Compromise Suggestions</p>
              {compromiseSuggestions.map((s, i) => (
                <div key={i} className="compromise-item">
                  <span className="compromise-dot" />
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYSIS TAB */}
      {activeTab === 'analysis' && (
        <div className="tab-content fade-in">
          <div className="analysis-grid">
            {/* Radar chart */}
            {radarData.length > 0 && users.length > 0 && (
              <div className="card">
                <p className="section-title">🎯 Preference Radar</p>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    {users.map((u, i) => (
                      <Radar
                        key={u.id}
                        name={u.name}
                        dataKey={u.name}
                        stroke={USER_COLORS[i % USER_COLORS.length]}
                        fill={USER_COLORS[i % USER_COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Detailed breakdown */}
            <div className="card">
              <p className="section-title">🔢 Dimension Breakdown</p>
              {users.map((u, i) => {
                const bd = selected.userBreakdowns?.[u.id];
                if (!bd) return null;
                return (
                  <div key={u.id} className="breakdown-user-block">
                    <div className="breakdown-user-header">
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length] }} />
                      <strong>{u.name}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(bd).map(([dim, val]) => (
                        <ScoreBar key={dim} label={dim} value={val} color={USER_COLORS[i % USER_COLORS.length]} />
                      ))}
                    </div>
                    {i < users.length - 1 && <div className="divider" style={{ margin: '12px 0' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode info */}
          <div className="card mode-info-card">
            <div className="mode-info-icon">{mode === 'democracy' ? '🗳️' : '👑'}</div>
            <div>
              <strong>{mode === 'democracy' ? 'Democracy Mode' : 'Priority Mode'} Active</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {mode === 'democracy'
                  ? 'All members had equal weight in the decision.'
                  : 'Members with higher global weights had more influence.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EXPLANATION TAB */}
      {activeTab === 'explanation' && (
        <div className="tab-content fade-in">
          <div className="card explanation-card">
            <p className="section-title">🧾 Decision Reasoning</p>
            <div className="explanation-lines">
              {selected.explanation?.map((line, i) => (
                <div key={i} className="explanation-line" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="exp-dot">→</span>
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Algorithm details */}
          <div className="card algorithm-card">
            <p className="section-title">⚙️ Algorithm Details</p>
            <div className="algo-steps">
              {[
                { icon: '1️⃣', title: 'Input Normalization', desc: 'All preferences are converted to [0,1] scores for fair comparison.' },
                { icon: '2️⃣', title: 'Weighted Scoring', desc: 'Each dimension is multiplied by the user\'s custom weights (1–5 scale).' },
                { icon: '3️⃣', title: 'Fairness Penalty', desc: 'Users who consistently got high satisfaction in past sessions get a small penalty to ensure rotation.' },
                { icon: '4️⃣', title: `Aggregate (${mode})`, desc: mode === 'democracy' ? 'Simple average of all scores.' : 'Weighted average using global user priority weights.' },
                { icon: '5️⃣', title: "Jain's Fairness Index", desc: 'Measures how evenly satisfaction is distributed (100 = perfect equality).' },
              ].map((step, i) => (
                <div key={i} className="algo-step">
                  <div className="algo-step-icon">{step.icon}</div>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOGISTICS TAB */}
      {activeTab === 'logistics' && (
        <div className="tab-content fade-in">
          
          <div className="card" style={{ marginBottom: 20 }}>
            <p className="section-title">📍 Destination Map</p>
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe 
                width="100%" 
                height="320" 
                frameBorder="0" 
                title="Restaurant Location Map"
                src={`https://maps.google.com/maps?q=${selected.restaurant.lat},${selected.restaurant.lng}&z=15&output=embed`}
                style={{ filter: 'invert(90%) hue-rotate(180deg) opacity(0.8)' }} // Gives it a cool dark mode look!
              />
            </div>
          </div>

          <div className="card">
            <p className="section-title">🗺️ Commute Plans</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Dynamically calculated distance to {selected.restaurant.name}.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {users.map((u, i) => {
                const plan = selected.logistics?.[u.id];
                if (!plan) return null;
                return (
                  <div key={u.id} className="logistics-row" style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="user-score-avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1.1rem' }}>{u.name}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>📍 {u.city} · {u.area} → {plan.distance}km</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>{plan.mode}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>⏱️ {plan.time}  |  💸 {plan.price}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ALTERNATIVES TAB */}
      {activeTab === 'alternatives' && (
        <div className="tab-content fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {alternatives?.length > 0 ? (
              alternatives.map((alt, i) => (
                <div key={i} className="alt-card card">
                  <div className="alt-rank">#{i + 2}</div>
                  <div className="alt-info">
                    <h3>{alt.restaurant.name}</h3>
                    <div className="alt-meta">
                      <span>🍽️ {alt.restaurant.cuisine}</span>
                      <span>₹{alt.restaurant.avgBudget}</span>
                      <span>📍 {alt.restaurant.distance}km</span>
                      <span>⭐ {alt.restaurant.rating}</span>
                    </div>
                  </div>
                  <div className="alt-scores">
                    <div>
                      <div className="alt-score-label">Score</div>
                      <div className="alt-score-value" style={{ color: SCORE_COLOR(alt.aggregateScore) }}>
                        {alt.aggregateScore}
                      </div>
                    </div>
                    <div>
                      <div className="alt-score-label">Fairness</div>
                      <div className="alt-score-value" style={{ color: '#8b5cf6' }}>
                        {alt.fairnessIndex}
                      </div>
                    </div>
                  </div>
                  <div className="alt-user-scores">
                    {Object.entries(alt.userScores || {}).map(([uid, score], j) => {
                      const u = result.users?.find(u => u.id === uid);
                      return (
                        <div key={uid} className="alt-user-badge" style={{ background: USER_COLORS[j % USER_COLORS.length] }}>
                          <span>{u?.name?.[0]?.toUpperCase() || '?'}</span>
                          <span>{Math.round(score)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No alternatives found. Try adding more restaurants to the database.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="result-footer">
        <button id="reset-btn" className="btn btn-ghost" onClick={onReset}>
          🔄 New Decision
        </button>
        <div className="result-meta">
          Mode: <strong>{mode}</strong> · Conflict: <strong style={{ color: CONFLICT_COLORS[conflict.intensity] }}>{conflict.intensity}</strong>
        </div>
      </div>
    </div>
  );
}
