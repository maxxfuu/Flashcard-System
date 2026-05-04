import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDeck } from '../context/DeckContext';
import '../styles/Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuth();
  const { decks, createDeck, deleteDeck } = useDeck();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deckName, setDeckName] = useState('');

  const handleCreateDeck = (e) => {
    e.preventDefault();
    if (deckName.trim()) {
      createDeck(deckName);
      setDeckName('');
      setShowCreateForm(false);
    }
  };

  const handleSelectDeck = (deckId) => {
    navigate(`/create/${deckId}`);
  };

  const handleStudyDeck = (deckId) => {
    navigate(`/study/${deckId}`);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="homepage">
      <header className="homepage-header">
        <div className="header-left">
          <h1>Flash Me</h1>
          <p>{isGuest ? 'Guest Mode' : `Welcome, ${user?.email}`}</p>
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
            {decks.map(deck => (
              <div key={deck.id} className="deck-card">
                <h3>{deck.name}</h3>
                <p>{deck.flashcards.length} cards</p>
                <div className="deck-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSelectDeck(deck.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStudyDeck(deck.id)}
                  >
                    Study
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteDeck(deck.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="action-section">
          {!showCreateForm ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowCreateForm(true)}
            >
              + Create New Set
            </button>
          ) : (
            <form className="create-form" onSubmit={handleCreateDeck}>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Enter deck name"
                autoFocus
                required
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setDeckName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
