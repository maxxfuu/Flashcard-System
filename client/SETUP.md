# Flash Me - Flashcard Memorizer

A modern React-based flashcard application with user authentication, deck management, and spaced repetition study sessions.

## Features

- 🔐 **User Authentication** - Sign in or continue as guest
- 📚 **Deck Management** - Create, edit, and delete flashcard decks
- 🎯 **Study Sessions** - Interactive flashcard reviews with flip animations
- 💡 **Hints System** - Get hints while studying
- 📊 **Session Metrics** - Track accuracy, correct answers, and hints used
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── FlashcardCard.jsx
│   ├── FlashcardForm.jsx
│   ├── MetricsSplash.jsx
│   └── ProtectedRoute.jsx
├── context/              # Context providers for state management
│   ├── AuthContext.jsx   # Authentication state
│   └── DeckContext.jsx   # Flashcard decks state
├── pages/                # Page components
│   ├── Landing.jsx
│   ├── Auth.jsx
│   ├── Homepage.jsx
│   ├── CreateSet.jsx
│   └── StudySession.jsx
├── styles/               # CSS files
├── App.jsx              # Main app component with routing
└── index.js            # Entry point
```

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Flow

1. **Landing Page** → Choose to sign in or continue as guest
2. **Homepage** → View your decks or create a new one
3. **Create Set** → Add flashcards to your deck
4. **Study Session** → Review cards, flip them, and rate your answers
5. **Metrics** → See your session performance

### Creating a Deck

1. Navigate to Homepage
2. Click "+ Create New Set"
3. Enter a deck name
4. Use the form to add flashcards (front, back, optional hint)
5. Click "Flash Me! Study Now" to start reviewing

### Studying

1. Select a deck and click "Study"
2. Click the card to flip it and see the answer
3. Use the hint button if needed (optional)
4. Answer "Yes" or "No" based on whether you got it right
5. Continue through all cards to see your metrics

## Available Scripts

- `npm start` - Run development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Technologies Used

- React 18.2
- React Router 6
- Context API for state management
- CSS3 with animations and gradients

## Future Enhancements

- [ ] Backend API integration
- [ ] User profiles and statistics
- [ ] Spaced repetition algorithm
- [ ] Dark mode
- [ ] Import/export decks
- [ ] Collaborative decks
- [ ] Mobile app

## Contributing

Feel free to fork this project and submit pull requests.

## License

MIT License - feel free to use this project however you like!
