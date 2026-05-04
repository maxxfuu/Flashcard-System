import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate('/home', { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-content">
          <h1>Flash Me</h1>
          <p className="landing-subtitle">Master your knowledge with spaced repetition</p>
          <div className="landing-buttons">
            <button className="btn btn-primary" onClick={signInWithGoogle}>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
