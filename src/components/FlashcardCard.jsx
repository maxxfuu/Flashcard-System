import React, { useState } from 'react';
import '../styles/FlashcardCard.css';

const FlashcardCard = ({ card, onAnswer, onUseHint, hintUsed }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flashcard-container">
      <div
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <p>{card.front}</p>
            <span className="flip-hint">Click to flip</span>
          </div>
          <div className="flashcard-back">
            <p>{card.back}</p>
          </div>
        </div>
      </div>

      <div className="card-controls">
        <div className="hint-section">
          {card.hint && (
            <button
              className={`btn btn-secondary ${hintUsed ? 'btn-used' : ''}`}
              onClick={() => {
                if (!hintUsed) onUseHint();
              }}
              disabled={hintUsed}
            >
              {hintUsed ? `Hint: ${card.hint}` : '💡 Show Hint'}
            </button>
          )}
        </div>

        <div className="answer-buttons">
          <button
            className="btn btn-danger btn-lg"
            onClick={() => {
              setIsFlipped(false);
              onAnswer(false);
            }}
          >
            ✗ No
          </button>
          <button
            className="btn btn-success btn-lg"
            onClick={() => {
              setIsFlipped(false);
              onAnswer(true);
            }}
          >
            ✓ Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardCard;
