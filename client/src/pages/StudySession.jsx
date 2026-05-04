import React, { useState, useEffect } from 'react';
import { playPing } from '../utils/audio';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import FlashcardCard from '../components/FlashcardCard';
import MetricsSplash from '../components/MetricsSplash';
import '../styles/StudySession.css';

const StudySession = () => {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const { decks, selectDeck, saveSessionStats } = useDeck();
  const [deck, setDeck] = useState(() => {
    const found = decks.find(d => d.id === deckId);
    if (found) selectDeck(deckId);
    return found;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [answers, setAnswers] = useState({});
  const [hintsUsed, setHintsUsed] = useState(new Set());
  const [startTime, setStartTime] = useState(Date.now());

  if (!deck || deck.flashcards.length === 0) {
    return (
      <div className="study-session">
        <p>No flashcards in this deck</p>
        <button className="btn btn-primary" onClick={() => navigate('/home')}>
          Back to Home
        </button>
      </div>
    );
  }

  const currentCard = deck.flashcards[currentIndex];
  const isLastCard = currentIndex === deck.flashcards.length - 1;

  const handleAnswer = (isCorrect) => {
    setAnswers(prev => ({
      ...prev,
      [currentCard.id]: isCorrect
    }));

    if (isLastCard) {
      const correctCount = Object.values({
        ...answers,
        [currentCard.id]: isCorrect
      }).filter(Boolean).length;
      const accuracy = Math.round((correctCount / deck.flashcards.length) * 100);
      const endTime = Date.now();
      const timeTakenInSeconds = Math.floor((endTime - startTime) / 1000);
      const minutes = Math.floor(timeTakenInSeconds / 60);
      const seconds = timeTakenInSeconds % 60;
      const timeTakenStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      saveSessionStats({
        deckName: deck.name,
        totalCards: deck.flashcards.length,
        correctCards: isCorrect ? correctCount : Object.values(answers).filter(Boolean).length,
        accuracy,
        hintsUsed: hintsUsed.size,
        timeTaken: timeTakenStr
      });

      setSessionComplete(true);
      playPing('hooray');
    } else {
      setCurrentIndex(current => current + 1);
    }
  };

  const handleUseHint = () => {
    setHintsUsed(prev => new Set([...prev, currentCard.id]));
  };

  const handleEndSession = () => {
    navigate('/home');
  };

  const handleRedoSession = () => {
    setCurrentIndex(0);
    setAnswers({});
    setHintsUsed(new Set());
    setStartTime(Date.now());
    setSessionComplete(false);
  };

  if (sessionComplete) {
    return <MetricsSplash onBack={handleEndSession} onRedo={handleRedoSession} />;
  }

  return (
    <div className="study-session">
      <header className="study-header">
        <button className="btn btn-text" onClick={() => navigate('/home')}>
          ← Exit
        </button>
        <div className="study-progress">
          <span>{currentIndex + 1} / {deck.flashcards.length}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / deck.flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="study-content">
        <FlashcardCard
          card={currentCard}
          onAnswer={handleAnswer}
          onUseHint={handleUseHint}
          hintUsed={hintsUsed.has(currentCard.id)}
        />
      </div>
    </div>
  );
};

export default StudySession;
