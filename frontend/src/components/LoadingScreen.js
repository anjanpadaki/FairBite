import React from 'react';
import './LoadingScreen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-screen fade-in">
      <div className="loading-inner">
        <div className="loading-orb">
          <div className="orb-ring ring-1"></div>
          <div className="orb-ring ring-2"></div>
          <div className="orb-ring ring-3"></div>
          <span className="orb-icon">🍽️</span>
        </div>
        <h2 className="loading-title gradient-text">Resolving Conflict...</h2>
        <p className="loading-sub">Analysing preferences, detecting conflicts, applying fairness algorithm</p>
        <div className="loading-steps">
          <div className="loading-step">📊 Normalizing preferences</div>
          <div className="loading-step">⚖️ Applying fairness weights</div>
          <div className="loading-step">🎯 Generating compromise</div>
        </div>
      </div>
    </div>
  );
}
