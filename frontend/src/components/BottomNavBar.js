import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './BottomNavBar.css';

import homeIcon from '../icons/Nav-icon/home.png';
import searchIcon from '../icons/Nav-icon/search.png';
import cartIcon from '../icons/Nav-icon/card.png';
import googleIcon from '../icons/Nav-icon/google.png';

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [userPhotoURL, setUserPhotoURL] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserPhotoURL(user.photoURL);
      } else {
        setUserPhotoURL(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: 'Home', icon: homeIcon, path: '/' },
    { name: 'Search', icon: searchIcon, path: '/search' },
    { name: 'Card', icon: cartIcon, path: '/cart' },
    { name: 'Profile', icon: userPhotoURL || googleIcon, path: '/profile' },
  ];

  const toggleCategories = () => {
    setCategoriesOpen(!categoriesOpen);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCategoriesOpen(false);
      }
    };
    if (categoriesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoriesOpen]);

  return (
    <nav className="bottom-nav-bar visible">
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        const isCenter = index === 2; // History button is center
        
        const handleClick = () => {
          if (item.path === '/' && location.pathname === '/') {
            // If already on home page, refresh it
            window.location.reload();
          } else {
            // Navigate to the page
            navigate(item.path);
          }
        };

        return (
          <button
            key={item.name}
            className={`nav-item ${isActive ? 'active' : ''} ${isCenter ? 'center-button' : ''}`}
            onClick={handleClick}
          >
            {item.icon && <img src={item.icon} alt={item.name} className="nav-icon" />}
            <span className="nav-label">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
