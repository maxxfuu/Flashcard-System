import React from 'react';
import { useDeck } from '../context/DeckContext';
import '../styles/MetricsSplash.css';

const MetricsSplash = ({ onBack, onRedo }) => {
  const { sessionStats } = useDeck();

  if (!sessionStats) {
    return (
      <div className="metrics-splash">
        <p>No session data available</p>
        <button className="btn btn-primary" onClick={onBack}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="metrics-splash">
      <div className="metrics-container">
        <div className="metrics-header">
          <h1>Session Complete! 🎉</h1>
          <p className="deck-name">{sessionStats.deckName}</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{sessionStats.accuracy}%</div>
            <div className="metric-label">Accuracy</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {sessionStats.correctCards}/{sessionStats.totalCards}
            </div>
            <div className="metric-label">Correct Answers</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">{sessionStats.hintsUsed}</div>
            <div className="metric-label">Hints Used</div>
          </div>

          <div className="metric-card">
            <div className="metric-value">{sessionStats.timeTaken}</div>
            <div className="metric-label">Time Taken</div>
          </div>
        </div>

        <div className="metrics-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {onRedo && (
            <button className="btn btn-secondary btn-lg" onClick={onRedo}>
              Redo Round
            </button>
          )}
          <button className="btn btn-primary btn-lg" onClick={onBack}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetricsSplash;
