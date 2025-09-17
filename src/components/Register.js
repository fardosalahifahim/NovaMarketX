import React, { useState } from 'react';
import './Register.css';
import { getAuth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { app } from '../firebaseConfig';
import axios from 'axios';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showVerifyButton, setShowVerifyButton] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: username,
        phoneNumber: phone
      });
      // Send email verification
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }
      // Save user data to backend admin panel
      await axios.post('http://localhost:5000/api/users', {
        username,
        email,
        phone,
        password
      });
      // Sign out the user to prevent auto-login
      await auth.signOut();
      // Show success message and provide link to verify
      setError('');
      setSuccessMessage('Registration successful! Please check your email and verify your account.');
      setShowVerifyButton(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        // Save user data to backend admin panel
        await axios.post('http://localhost:5000/api/users', {
          username: user.displayName || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          password: '' // No password for Google sign-in
        });
        onRegister(true);
        setError('');
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  const handleGoToVerify = () => {
    window.location.href = '/verify-email';
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <button type="submit">Register</button>
        {showVerifyButton && (
          <button className="verify-btn" onClick={handleGoToVerify}>
            Go to Email Verification
          </button>
        )}
      </form>
      <button className="google-signin-btn" onClick={handleGoogleSignIn}>
        <img
          src={require('../icons/Nav-icon/google.png')}
          alt="Google logo"
          className="google-logo"
        />
        Sign in with Google
      </button>
      <div className="login-section">
        <button className="login-btn" onClick={handleGoToLogin}>
          Already have an account? Login
        </button>
      </div>
    </div>
  );
};

export default Register;
