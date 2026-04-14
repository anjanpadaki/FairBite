import React from 'react';
import './StepIndicator.css';

export default function StepIndicator({ steps, current }) {
  return (
    <div className="step-indicator-wrap fade-in">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className={`step-item ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}>
            <div className="step-circle">
              {i < current ? '✓' : i + 1}
            </div>
            <span className="step-label">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line ${i < current ? 'done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
