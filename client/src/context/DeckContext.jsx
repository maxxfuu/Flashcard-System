import React, { createContext, useState, useCallback } from 'react';

export const DeckContext = createContext();

export const DeckProvider = ({ children }) => {
  const [decks, setDecks] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);

  const createDeck = useCallback((name) => {
    const newDeck = {
      id: Math.random().toString(),
      name,
      flashcards: [],
      createdAt: new Date().toISOString(),
    };
    setDecks(prev => [...prev, newDeck]);
    return newDeck;
  }, []);

  const updateDeck = useCallback((deckId, name) => {
    setDecks(prev => prev.map(deck =>
      deck.id === deckId ? { ...deck, name } : deck
    ));
  }, []);

  const deleteDeck = useCallback((deckId) => {
    setDecks(prev => prev.filter(deck => deck.id !== deckId));
    if (currentDeck?.id === deckId) {
      setCurrentDeck(null);
    }
  }, [currentDeck]);

  const addFlashcard = useCallback((deckId, frondd, back, hint = '') => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          flashcards: [...deck.flashcards, {
            id: Math.random().toString(),
            front: frondd,
            back,
            hint,
          }]
        };
      }
      return deck;
    }));
  }, []);

  const updateFlashcard = useCallback((deckId, cardId, front, back, hint) => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          flashcards: deck.flashcards.map(card =>
            card.id === cardId ? { ...card, front, back, hint } : card
          )
        };
      }
      return deck;
    }));
  }, []);

  const deleteFlashcard = useCallback((deckId, cardId) => {
    setDecks(prev => prev.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          flashcards: deck.flashcards.filter(card => card.id !== cardId)
        };
      }
      return deck;
    }));
  }, []);

  const selectDeck = useCallback((deckId) => {
    const deck = decks.find(d => d.id === deckId);
    setCurrentDeck(deck || null);
  }, [decks]);

  const saveSessionStats = useCallback((stats) => {
    setSessionStats(stats);
  }, []);

  return (
    <DeckContext.Provider value={{
      decks,
      currentDeck,
      sessionStats,
      createDeck,
      updateDeck,
      deleteDeck,
      addFlashcard,
      updateFlashcard,
      deleteFlashcard,
      selectDeck,
      saveSessionStats
    }}>
      {children}
    </DeckContext.Provider>
  );
};

export const useDeck = () => {
  const context = React.useContext(DeckContext);
  if (!context) {
    throw new Error('useDeck must be used within DeckProvider');
  }
  return context;
};
