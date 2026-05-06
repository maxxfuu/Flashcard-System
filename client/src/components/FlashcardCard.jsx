import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { playPing } from '../utils/audio';
import '../styles/FlashcardCard.css';

const FlashcardCard = ({ card, onAnswer, onUseHint, hintUsed }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [generatedHint, setGeneratedHint] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Refs so the single keydown handler always reads current values
  const showConfidenceRef = useRef(showConfidence);
  const isFlippedRef = useRef(isFlipped);
  const hintUsedRef = useRef(hintUsed);
  const isGeneratingRef = useRef(isGenerating);
  const onAnswerRef = useRef(onAnswer);
  const onUseHintRef = useRef(onUseHint);

  useEffect(() => { showConfidenceRef.current = showConfidence; }, [showConfidence]);
  useEffect(() => { isFlippedRef.current = isFlipped; }, [isFlipped]);
  useEffect(() => { hintUsedRef.current = hintUsed; }, [hintUsed]);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);
  useEffect(() => { onAnswerRef.current = onAnswer; }, [onAnswer]);
  useEffect(() => { onUseHintRef.current = onUseHint; }, [onUseHint]);

  useEffect(() => {
    setGeneratedHint(null);
    setIsFlipped(false);
    setShowConfidence(false);
  }, [card]);

  const displayHintRef = useRef(card.hint || generatedHint);
  useEffect(() => { displayHintRef.current = card.hint || generatedHint; }, [card, generatedHint]);

  const displayHint = card.hint || generatedHint;

  const handleGenerateHint = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const response = await fetch(
        process.env.REACT_APP_GENERATE_HINT_URL || '/api/ml/generate-hint',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ front: card.front, back: card.back })
        }
      );
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
  }, [isGenerating, card.front, card.back, onUseHint]);
  const handleGenerateHintRef = useRef(handleGenerateHint);
  useEffect(() => { handleGenerateHintRef.current = handleGenerateHint; }, [handleGenerateHint]);

  const handleWrongAnswer = () => {
    playPing('no');
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      onAnswerRef.current(false);
    }, 420);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.45 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        playPing('flip');
        setIsFlipped(prev => !prev);
        return;
      }

      if (showConfidenceRef.current) {
        if (e.key === '1') {
          e.preventDefault();
          playPing('confidence');
          fireConfetti();
          setIsFlipped(false);
          setShowConfidence(false);
          onAnswerRef.current(true, 'low');
        } else if (e.key === '2') {
          e.preventDefault();
          playPing('confidence');
          fireConfetti();
          setIsFlipped(false);
          setShowConfidence(false);
          onAnswerRef.current(true, 'medium');
        } else if (e.key === '3') {
          e.preventDefault();
          playPing('confidence');
          fireConfetti();
          setIsFlipped(false);
          setShowConfidence(false);
          onAnswerRef.current(true, 'high');
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (!hintUsedRef.current && !isGeneratingRef.current && !isFlippedRef.current) {
          playPing('hint');
          if (displayHintRef.current) onUseHintRef.current();
          else handleGenerateHintRef.current();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        playPing('yes');
        setShowConfidence(true);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleWrongAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);  // attaches once — all state read via refs

  return (
    <div className="flashcard-container">
      <div
        className={`flashcard ${isFlipped ? 'flipped' : ''} ${isShaking ? 'shake' : ''}`}
        onClick={() => {
          playPing('flip');
          setIsFlipped(!isFlipped);
        }}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <p>{card.front}</p>
            <span className="flip-hint">Click or Space to flip</span>
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
                if (!hintUsed && !showConfidence) {
                  playPing('hint');
                  onUseHint();
                }
              }}
              disabled={hintUsed || showConfidence || isFlipped}
            >
              {hintUsed ? `Hint: ${displayHint}` : isFlipped ? '🔒 Flip back to use hint' : '💡 Show Hint (Tab)'}
            </button>
          ) : (
            <button
              className={`btn btn-secondary`}
              onClick={showConfidence ? undefined : () => {
                playPing('hint');
                handleGenerateHint();
              }}
              disabled={isGenerating || showConfidence || isFlipped}
            >
              {isGenerating ? 'Generating...' : isFlipped ? '🔒 Flip back to generate hint' : '🤖 Generate Hint (Tab)'}
            </button>
          )}
        </div>

        <div className="answer-buttons">
          {!showConfidence ? (
            <>
              <button
                className="btn btn-danger btn-lg"
                onClick={handleWrongAnswer}
              >
                ✗ No (Del)
              </button>
              <button
                className="btn btn-success btn-lg"
                onClick={() => {
                  playPing('yes');
                  setShowConfidence(true);
                }}
              >
                ✓ Yes (Enter)
              </button>
            </>
          ) : (
            <div className="confidence-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-danger btn-lg"
                onClick={() => {
                  playPing('confidence');
                  fireConfetti();
                  setIsFlipped(false);
                  setShowConfidence(false);
                  onAnswer(true, 'low');
                }}
              >
                Low (1)
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  playPing('confidence');
                  fireConfetti();
                  setIsFlipped(false);
                  setShowConfidence(false);
                  onAnswer(true, 'medium');
                }}
              >
                Medium (2)
              </button>
              <button
                className="btn btn-success btn-lg"
                onClick={() => {
                  playPing('confidence');
                  fireConfetti();
                  setIsFlipped(false);
                  setShowConfidence(false);
                  onAnswer(true, 'high');
                }}
              >
                High (3)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardCard;
