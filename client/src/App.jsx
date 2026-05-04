import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DeckProvider } from './context/DeckContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Homepage from './pages/Homepage';
import CreateSet from './pages/CreateSet';
import StudySession from './pages/StudySession';
import './styles/App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DeckProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Homepage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create/:deckId"
              element={
                <ProtectedRoute>
                  <CreateSet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/study/:deckId"
              element={
                <ProtectedRoute>
                  <StudySession />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DeckProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
