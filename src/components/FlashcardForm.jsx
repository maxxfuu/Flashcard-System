import React, { useState } from 'react';
import '../styles/FlashcardForm.css';

const FlashcardForm = ({ onSubmit, initialData = null }) => {
  const [front, setFront] = useState(initialData?.front || '');
  const [back, setBack] = useState(initialData?.back || '');
  const [hint, setHint] = useState(initialData?.hint || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
      onSubmit(front.trim(), back.trim(), hint.trim());
      setFront('');
      setBack('');
      setHint('');
    }
  };

  return (
    <form className="flashcard-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="front">Front (Question/Prompt)</label>
        <input
          id="front"
          type="text"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="e.g., What is the capital of France?"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="back">Back (Answer)</label>
        <input
          id="back"
          type="text"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="e.g., Paris"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="hint">Hint (Optional)</label>
        <input
          id="hint"
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g., It's near the Seine River"
        />
      </div>

      <button type="submit" className="btn btn-primary">
        {initialData ? 'Update Card' : 'Add Card'}
      </button>
    </form>
  );
};

export default FlashcardForm;
