import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDeck } from '../context/DeckContext';
import '../styles/Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { decks, createDeck, deleteDeck } = useDeck();
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Keep refs in sync so the single event handler always reads current values
  const decksRef = useRef(decks);
  const selectedIndexRef = useRef(selectedIndex);
  const navigateRef = useRef(navigate);
  const deleteDeckRef = useRef(deleteDeck);
  const createDeckRef = useRef(createDeck);

  useEffect(() => { decksRef.current = decks; }, [decks]);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { deleteDeckRef.current = deleteDeck; }, [deleteDeck]);
  useEffect(() => { createDeckRef.current = createDeck; }, [createDeck]);

  const handleCreateDeck = async () => {
    const newDeck = await createDeck('Untitled Deck');
    if (newDeck) navigate(`/create/${newDeck.id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const currentDecks = decksRef.current;
      const currentSelected = selectedIndexRef.current;

      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < currentDecks.length) {
          setSelectedIndex(idx);
        }
        return;
      }

      if (e.key === 'Escape') {
        setSelectedIndex(null);
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        createDeckRef.current('Untitled Deck').then(newDeck => {
          if (newDeck) navigateRef.current(`/create/${newDeck.id}`);
        });
        return;
      }

      if (currentSelected === null || currentSelected >= currentDecks.length) return;

      const deck = currentDecks[currentSelected];
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        navigateRef.current(`/create/${deck.id}`);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        navigateRef.current(`/study/${deck.id}`);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        deleteDeckRef.current(deck.id);
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);  // attaches once, reads latest values via refs

  return (
    <div className="homepage">
      <header className="homepage-header">
        <div className="header-left">
          <h1>Flash Me</h1>
          <p>Welcome, {user?.email}</p>
        </div>
        <button className="btn btn-text" onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <div className="homepage-content">
        {!decks.length ? (
          <div className="empty-state">
            <h2>No decks yet</h2>
            <p>Create your first flashcard set to get started</p>
          </div>
        ) : (
          <div className="deck-grid">
            {decks.map((deck, index) => (
              <div
                key={deck.id}
                className={`deck-card ${selectedIndex === index ? 'deck-card-selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                <div className="deck-card-header">
                  <span className="deck-number">{index + 1}</span>
                  <h3>{deck.title}</h3>
                </div>
                {selectedIndex === index && (
                  <p className="deck-shortcut-hint">(E) Edit · (S) Study · (⌫) Delete</p>
                )}
                <div className="deck-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={(e) => { e.stopPropagation(); navigate(`/create/${deck.id}`); }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={(e) => { e.stopPropagation(); navigate(`/study/${deck.id}`); }}
                  >
                    Study
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="action-section">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateDeck}
          >
            + Create New Set (C)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
