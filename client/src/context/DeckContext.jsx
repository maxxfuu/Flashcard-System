import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/api';

const DeckContext = createContext();

export const DeckProvider = ({ children }) => {
  const { user, session } = useAuth();
  const [decks, setDecks] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);

  const token = session?.access_token;

  const loadDecks = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/flashcards/decks', {}, token);
      setDecks(data);
    } catch (err) {
      console.error('Failed to load decks:', err);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      loadDecks();
    } else {
      setDecks([]);
      setCurrentDeck(null);
    }
  }, [user, loadDecks]);

  const loadDeck = useCallback(async (deckId) => {
    if (!token) return null;
    try {
      const data = await apiFetch(`/flashcards/decks/${deckId}`, {}, token);
      setCurrentDeck(data);
      return data;
    } catch (err) {
      console.error('Failed to load deck:', err);
      return null;
    }
  }, [token]);

  const createDeck = useCallback(async (title) => {
    if (!token) return;
    try {
      const newDeck = await apiFetch('/flashcards/decks', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }, token);
      setDecks(prev => [...prev, newDeck]);
      return newDeck;
    } catch (err) {
      console.error('Failed to create deck:', err);
    }
  }, [token]);

  const deleteDeck = useCallback(async (deckId) => {
    if (!token) return;
    try {
      await apiFetch(`/flashcards/decks/${deckId}`, { method: 'DELETE' }, token);
      setDecks(prev => prev.filter(d => d.id !== deckId));
      if (currentDeck?.id === deckId) setCurrentDeck(null);
    } catch (err) {
      console.error('Failed to delete deck:', err);
    }
  }, [token, currentDeck]);

  const addFlashcard = useCallback(async (deckId, front, back, hint = '') => {
    if (!token) return;
    try {
      const newCard = await apiFetch(`/flashcards/decks/${deckId}/cards`, {
        method: 'POST',
        body: JSON.stringify({ front, back, ...(hint ? { hint } : {}) }),
      }, token);
      setCurrentDeck(prev =>
        prev?.id === deckId ? { ...prev, cards: [...(prev.cards ?? []), newCard] } : prev
      );
      return newCard;
    } catch (err) {
      console.error('Failed to add card:', err);
    }
  }, [token]);

  const updateFlashcard = useCallback(async (deckId, cardId, front, back, hint) => {
    if (!token) return;
    try {
      const updated = await apiFetch(`/flashcards/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify({ front, back, hint: hint || undefined }),
      }, token);
      setCurrentDeck(prev =>
        prev?.id === deckId
          ? { ...prev, cards: prev.cards.map(c => c.id === cardId ? updated : c) }
          : prev
      );
      return updated;
    } catch (err) {
      console.error('Failed to update card:', err);
    }
  }, [token]);

  const deleteFlashcard = useCallback(async (deckId, cardId) => {
    if (!token) return;
    try {
      await apiFetch(`/flashcards/cards/${cardId}`, { method: 'DELETE' }, token);
      setCurrentDeck(prev =>
        prev?.id === deckId
          ? { ...prev, cards: prev.cards.filter(c => c.id !== cardId) }
          : prev
      );
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  }, [token]);

  const saveSessionStats = useCallback((stats) => {
    setSessionStats(stats);
  }, []);

  return (
    <DeckContext.Provider value={{
      decks,
      currentDeck,
      sessionStats,
      loadDecks,
      loadDeck,
      createDeck,
      deleteDeck,
      addFlashcard,
      updateFlashcard,
      deleteFlashcard,
      saveSessionStats,
    }}>
      {children}
    </DeckContext.Provider>
  );
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (!context) throw new Error('useDeck must be used within DeckProvider');
  return context;
};
