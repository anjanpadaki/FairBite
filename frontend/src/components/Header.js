import React from 'react';
import './Header.css';

export default function Header({ onSeed }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo">🍽️</span>
          <div>
            <h1 className="header-title gradient-text">FairBite</h1>
            <p className="header-subtitle">Smart Food Conflict Resolver</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            id="seed-data-btn"
            className="btn btn-ghost btn-sm"
            onClick={onSeed}
            title="Load sample restaurant data into the database"
          >
            🗄️ Seed Restaurants
          </button>
        </div>
      </div>
    </header>
  );
}
