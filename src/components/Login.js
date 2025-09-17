import React, { useState } from 'react';
import './Login.css';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Disable email login for admin panel
    if (email === 'admin@example.com') {
      setError('Email login is disabled for admin panel');
      setLoginSuccess(false);
      return;
    }
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (!user.emailVerified) {
          // Sign out the user if email not verified
          auth.signOut();
          setError('Please verify your email address before logging in. Check your inbox for the verification link.');
          setLoginSuccess(false);
          return;
        }
        // Signed in and verified
        setLoginSuccess(true);
        onLogin(true);
        setError('');
        navigate('/');
      })
      .catch((error) => {
        setError(error.message);
        setLoginSuccess(false);
      });
  };

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        if (!user.emailVerified) {
          // Sign out if not verified
          auth.signOut();
          setError('Please verify your email address before logging in.');
          setLoginSuccess(false);
          return;
        }
        // Send user info to backend
        fetch('http://localhost:5000/api/users/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }),
        })
        .then(response => response.json())
        .then(data => {
          console.log('User registered/updated in backend:', data);
        })
        .catch(error => {
          console.error('Error registering user in backend:', error);
        });

        setLoginSuccess(true);
        onLogin(true);
        setError('');
        navigate('/');
      })
      .catch((error) => {
        setError(error.message);
        setLoginSuccess(false);
      });
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setResetMessage('Password reset email sent! Check your inbox.');
        setError('');
      })
      .catch((error) => {
        setError(error.message);
        setResetMessage('');
      });
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="forgot-password-container">
        <button className="forgot-password-container" onClick={handleForgotPassword}>
          Forgot Password?
        </button>
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <button className="google-signin-button" onClick={handleGoogleSignIn}>
        <img
          src={require('../icons/Nav-icon/google.png')}
          alt="Google logo"
          className="google-logo"
        />
        Sign in with Google
      </button>
      <div className="register-section">
        <button className="register-btn" onClick={() => navigate('/register')}>
          Don't have an account? Sign up
        </button>
      </div>
      {loginSuccess && <p className="success-message">Login successful!</p>}
      {resetMessage && <p className="reset-message">{resetMessage}</p>}
    </div>
  );
};

export default Login;
