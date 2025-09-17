import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.emailVerified) {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleResendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        setMessage('Verification email sent! Please check your inbox.');
        setError('');
      } catch (err) {
        setError('Failed to send verification email. Please try again.');
        setMessage('');
      }
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-container">
      <h2>Verify Your Email</h2>
      <p>Please check your email and click the verification link to activate your account.</p>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <button onClick={handleResendVerification} className="resend-btn">Resend Verification Email</button>
      <button onClick={handleGoToLogin} className="login-btn">Back to Login</button>
    </div>
  );
};

export default VerifyEmail;
