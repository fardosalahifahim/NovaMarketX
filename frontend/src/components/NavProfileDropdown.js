import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './NavProfileDropdown.css';

const NavProfileDropdown = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const auth = getAuth();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const [imgSrc, setImgSrc] = useState('/icons/Nav-icon/profile.png');

  React.useEffect(() => {
    console.log('User object:', user);
    if (user && user.photoURL) {
      console.log('Setting imgSrc to user.photoURL:', user.photoURL);
      setImgSrc(user.photoURL);
    } else {
      console.log('Setting imgSrc to default profile icon');
      setImgSrc('/icons/Nav-icon/profile.png');
    }
  }, [user]);

  const handleImgError = () => {
    setImgSrc('/icons/Nav-icon/profile.png');
  };

  if (!user) {
    return (
      <div className="nav-profile-login-register">
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/register" className="nav-link">Register</Link>
      </div>
    );
  }

  return (
    <div className="nav-profile-dropdown" ref={dropdownRef}>
      <img
        src={imgSrc}
        alt="Profile"
        className="nav-profile-img"
        onClick={toggleDropdown}
        onError={handleImgError}
        style={{ cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%' }}
      />
      {open && (
        <div className="dropdown-card">
          <Link to="/profile" className="dropdown-item" onClick={() => setOpen(false)}>
            My Account
          </Link>
          <Link to="/myorders" className="dropdown-item" onClick={() => setOpen(false)}>
            My Orders
          </Link>
          <button className="dropdown-item logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default NavProfileDropdown;
