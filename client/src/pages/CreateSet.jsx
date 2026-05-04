import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import FlashcardForm from '../components/FlashcardForm';
import '../styles/CreateSet.css';

const CreateSet = () => {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const { currentDeck, loadDeck, addFlashcard, deleteFlashcard, updateDeck } = useDeck();
  const [title, setTitle] = useState('');

  const currentDeckRef = useRef(currentDeck);
  useEffect(() => { currentDeckRef.current = currentDeck; }, [currentDeck]);

  useEffect(() => {
    loadDeck(deckId);
  }, [deckId, loadDeck]);

  useEffect(() => {
    if (currentDeck?.id === deckId) {
      setTitle(currentDeck.title);
    }
  }, [currentDeck, deckId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (currentDeckRef.current?.cards?.length > 0) navigate(`/study/${deckId}`);
      } else if (e.key === 'Escape') {
        navigate('/home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, deckId]);

  const handleAddCard = (front, back, hint) => {
    addFlashcard(deckId, front, back, hint);
  };

  const handleDeleteCard = (cardId) => {
    deleteFlashcard(deckId, cardId);
  };

  const handleFlashMe = () => {
    if (currentDeck?.cards?.length > 0) {
      navigate(`/study/${deckId}`);
    } else {
      alert('Please add at least one flashcard before studying');
    }
  };

  if (!currentDeck || currentDeck.id !== deckId) {
    return (
      <div className="create-set">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="create-set">
      <header className="create-header">
        <div className="header-left">
          <button className="btn btn-text" onClick={() => navigate('/home')}>
            ← Back
          </button>
          <input
            className="deck-title-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => { if (title.trim()) updateDeck(deckId, title.trim()); }}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
          />
        </div>
      </header>

      <div className="create-content">
        <div className="form-section">
          <h2>Add Flashcard</h2>
          <FlashcardForm onSubmit={handleAddCard} />
        </div>

        <div className="cards-section">
          <h2>Flashcards ({currentDeck.cards?.length ?? 0})</h2>
          {!currentDeck.cards?.length ? (
            <p className="empty-message">No cards yet. Add one to get started!</p>
          ) : (
            <div className="cards-list">
              {currentDeck.cards.map(card => (
                <div key={card.id} className="card-item">
                  <div className="card-content">
                    <div className="card-front">
                      <strong>Front:</strong> {card.front}
                    </div>
                    <div className="card-back">
                      <strong>Back:</strong> {card.back}
                    </div>
                    {card.hint && (
                      <div className="card-hint">
                        <strong>Hint:</strong> {card.hint}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="create-footer">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleFlashMe}
          disabled={!currentDeck.cards?.length}
        >
          Flash Me! Study Now (S)
        </button>
      </footer>
    </div>
  );
};

export default CreateSet;
