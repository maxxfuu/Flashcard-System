import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { continueAsGuest, signIn } = useAuth();

  const handleContinueAsGuest = () => {
    continueAsGuest();
    navigate('/home');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-content">
          <h1>Flash Me</h1>
          <p className="landing-subtitle">Master your knowledge with spaced repetition</p>

          <div className="landing-buttons">
            <button className="btn btn-primary" onClick={handleSignIn}>
              Sign In
            </button>
            <button className="btn btn-secondary" onClick={handleContinueAsGuest}>
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
