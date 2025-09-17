import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useNotification } from '../contexts/NotificationContext';
import './NavProfileDropdownRight.css';

const NavProfileDropdownRight = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState(null);
  const [imgSrc, setImgSrc] = useState('/icons/Nav-icon/profile.png');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (user && user.photoURL) {
      setImgSrc(user.photoURL);
    } else {
      setImgSrc('/icons/Nav-icon/profile.png');
    }
  }, [user]);

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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.photoURL) {
        setImgSrc(currentUser.photoURL);
      } else {
        setImgSrc('/icons/Nav-icon/profile.png');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImgError = () => {
    console.error('Profile image failed to load, falling back to default.');
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
    <div className="nav-profile-dropdown-right" ref={dropdownRef}>
      <img
        key={imgSrc}
        src={imgSrc}
        alt="Profile"
        className="nav-profile-img-right"
        onClick={toggleDropdown}
        onError={handleImgError}
        style={{ cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%' }}
      />
      {open && (
        <div className="dropdown-card-right">
          <Link to="/myorders" className="dropdown-item-right" onClick={() => setOpen(false)}>
            My Orders
          </Link>
          <Link to="/profile" className="dropdown-item-right" onClick={() => setOpen(false)}>
            My Account
          </Link>
          <button className="dropdown-item-right logout-button-right" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default NavProfileDropdownRight;
