import React, { useState, useEffect } from 'react';
import { playPing } from '../utils/audio';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import FlashcardCard from '../components/FlashcardCard';
import MetricsSplash from '../components/MetricsSplash';
import '../styles/StudySession.css';

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const StudySession = () => {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const { currentDeck, loadDeck, saveSessionStats } = useDeck();
  const { session } = useAuth();

  // Round state
  const [roundCards, setRoundCards] = useState([]);       // cards in current round (may contain duplicates)
  const [cardIndex, setCardIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundResultsMap, setRoundResultsMap] = useState({}); // cardId → aggregated result
  const [cardStartTime, setCardStartTime] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(new Set());     // hint card IDs for current round
  const [totalHintsCount, setTotalHintsCount] = useState(0); // accumulated across rounds

  // Session state
  const [sessionStartTime] = useState(Date.now());
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isProcessingRound, setIsProcessingRound] = useState(false);

  useEffect(() => {
    loadDeck(deckId);
  }, [deckId, loadDeck]);

  // Initialize first round once the deck is loaded
  useEffect(() => {
    if (
      currentDeck?.id === deckId &&
      currentDeck.cards?.length > 0 &&
      roundCards.length === 0
    ) {
      setRoundCards(shuffle([...currentDeck.cards]));
      setCardStartTime(Date.now());
    }
  }, [currentDeck, deckId, roundCards.length]);

  const deck = currentDeck?.id === deckId ? currentDeck : null;
  const currentCard = roundCards[cardIndex] ?? null;

  const handleAnswer = async (isCorrect, confidence = 'low') => {
    if (!currentCard || isProcessingRound) return;

    const timeForCard = cardStartTime ? (Date.now() - cardStartTime) / 1000 : 0;
    const usedHint = hintsUsed.has(currentCard.id);
    const normalizedConfidence = isCorrect
      ? confidence.charAt(0).toUpperCase() + confidence.slice(1).toLowerCase()
      : 'Low';

    // Aggregate this card's result — if it appears multiple times in a round,
    // use the latest correctness/confidence and a rolling average for time.
    const existing = roundResultsMap[currentCard.id];
    const newCount = (existing?.count ?? 0) + 1;
    const newAvgTime = existing
      ? (existing.current_time * existing.count + timeForCard) / newCount
      : timeForCard;

    const updatedResultsMap = {
      ...roundResultsMap,
      [currentCard.id]: {
        correctness: isCorrect ? 1 : 0,
        confidence: normalizedConfidence,
        current_time: newAvgTime,
        used_hint: (existing?.used_hint ?? false) || usedHint,
        count: newCount,
      },
    };

    const isLastCard = cardIndex === roundCards.length - 1;

    if (!isLastCard) {
      setRoundResultsMap(updatedResultsMap);
      setCardIndex(i => i + 1);
      setCardStartTime(Date.now());
      return;
    }

    // ── End of round ──────────────────────────────────────────────────────────
    setIsProcessingRound(true);

    const roundResults = Object.entries(updatedResultsMap).map(([cardId, r]) => ({
      card_id: cardId,
      correctness: r.correctness,
      confidence: r.confidence,
      current_time: r.current_time,
      used_hint: r.used_hint,
    }));

    try {
      const mlResults = await apiFetch(
        '/sessions/round',
        { method: 'POST', body: JSON.stringify(roundResults) },
        session?.access_token
      );

      // Session is complete when every card was answered Good/Easy (instances === 1)
      const allMastered = mlResults.every(r => r.instances_for_next_round <= 1);

      if (allMastered) {
        const timeTakenInSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(timeTakenInSeconds / 60);
        const seconds = timeTakenInSeconds % 60;
        const correctCount = roundResults.filter(r => r.correctness === 1).length;

        saveSessionStats({
          deckName: deck.title,
          totalCards: deck.cards.length,
          correctCards: correctCount,
          accuracy: Math.round((correctCount / roundResults.length) * 100),
          hintsUsed: totalHintsCount + hintsUsed.size,
          timeTaken: minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
          totalRounds: roundNumber,
        });
        setSessionComplete(true);
        playPing('hooray');
      } else {
        // Build next round: each card appears instances_for_next_round times
        const cardById = Object.fromEntries(deck.cards.map(c => [c.id, c]));
        const nextRound = [];
        for (const r of mlResults) {
          const card = cardById[r.card_id];
          if (card) {
            for (let i = 0; i < r.instances_for_next_round; i++) {
              nextRound.push(card);
            }
          }
        }

        setTotalHintsCount(prev => prev + hintsUsed.size);
        setRoundCards(shuffle(nextRound));
        setCardIndex(0);
        setRoundNumber(n => n + 1);
        setRoundResultsMap({});
        setHintsUsed(new Set());
        setCardStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to submit round:', err);
      // Fall back gracefully — end session without FSRS update
      setSessionComplete(true);
    } finally {
      setIsProcessingRound(false);
    }
  };

  const handleUseHint = () => {
    if (currentCard) {
      setHintsUsed(prev => new Set([...prev, currentCard.id]));
    }
  };

  const handleRedoSession = () => {
    if (!deck?.cards?.length) return;
    setRoundCards(shuffle([...deck.cards]));
    setCardIndex(0);
    setRoundNumber(1);
    setRoundResultsMap({});
    setHintsUsed(new Set());
    setTotalHintsCount(0);
    setCardStartTime(Date.now());
    setSessionComplete(false);
  };

  // ── Render gates ─────────────────────────────────────────────────────────────

  if (!deck) {
    return <div className="study-session"><p>Loading...</p></div>;
  }

  if (deck.cards.length === 0) {
    return (
      <div className="study-session">
        <p>No flashcards in this deck</p>
        <button className="btn btn-primary" onClick={() => navigate('/home')}>
          Back to Home
        </button>
      </div>
    );
  }

  if (sessionComplete) {
    return <MetricsSplash onBack={() => navigate('/home')} onRedo={handleRedoSession} />;
  }

  if (isProcessingRound) {
    return (
      <div className="study-session">
        <p style={{ textAlign: 'center', paddingTop: '4rem' }}>Calculating next round...</p>
      </div>
    );
  }

  if (!currentCard) {
    return <div className="study-session"><p>Loading...</p></div>;
  }

  return (
    <div className="study-session">
      <header className="study-header">
        <button className="btn btn-text" onClick={() => navigate('/home')}>
          ← Exit
        </button>
        <div className="study-progress">
          <span>Round {roundNumber} &nbsp;·&nbsp; {cardIndex + 1} / {roundCards.length}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((cardIndex + 1) / roundCards.length) * 100}%` }}
            />
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
