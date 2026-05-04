import React, { useState, useEffect } from 'react';
import '../styles/FlashcardCard.css';

const FlashcardCard = ({ card, onAnswer, onUseHint, hintUsed }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [generatedHint, setGeneratedHint] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);

  useEffect(() => {
    setGeneratedHint(null);
    setIsFlipped(false);
    setShowConfidence(false);
  }, [card]);

  const displayHint = card.hint || generatedHint;

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
          {displayHint ? (
            <button
              className={`btn btn-secondary ${hintUsed ? 'btn-used' : ''}`}
              onClick={() => {
                if (!hintUsed) onUseHint();
              }}
              disabled={hintUsed}
            >
              {hintUsed ? `Hint: ${displayHint}` : '💡 Show Hint'}
            </button>
          ) : (
            <button
              className={`btn btn-secondary`}
              onClick={async () => {
                if (isGenerating) return;
                setIsGenerating(true);
                try {
                  const response = await fetch('http://localhost:8000/generate-hint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ front: card.front, back: card.back })
                  });
                  if (!response.ok) throw new Error("Failed to generate hint");
                  const data = await response.json();
                  setGeneratedHint(data.hint);
                  onUseHint();
                } catch (error) {
                  console.error("Error generating hint:", error);
                  alert("Failed to generate hint from DL server.");
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : '🤖 Generate Hint'}
            </button>
          )}
        </div>

        <div className="answer-buttons">
          {!showConfidence ? (
            <>
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
                onClick={() => setShowConfidence(true)}
              >
                ✓ Yes
              </button>
            </>
          ) : (
            <div className="confidence-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-danger btn-lg"
                onClick={() => {
                  setIsFlipped(false);
                  setShowConfidence(false);
                  onAnswer(true, 'low');
                }}
              >
                Low
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  setIsFlipped(false);
                  setShowConfidence(false);
                  onAnswer(true, 'medium');
                }}
              >
                Medium
              </button>
              <button
                className="btn btn-success btn-lg"
                onClick={() => {
                  setIsFlipped(false);
                  setShowConfidence(false);
                  onAnswer(true, 'high');
                }}
              >
                High
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardCard;
