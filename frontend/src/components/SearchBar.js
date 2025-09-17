import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './SearchBar.css';

import searchIcon from '../icons/Nav-icon/search.png';
import cartIcon from '../icons/Nav-icon/card.png';
import profileIcon from '../icons/Nav-icon/profile.png';

const SearchBar = ({ placeholder = "Search" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPhoneView, setIsPhoneView] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsPhoneView(window.innerWidth <= 600);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleCartOrProfileClick = () => {
    if (isPhoneView) {
      navigate('/profile');
    } else {
      navigate('/cart');
    }
  };

  return (
    <form className="search-bar-container" onSubmit={handleSubmit}>
      <div className="icon-container" onClick={() => { if (!isPhoneView) { /* Left card clickable action */ alert('Search icon clicked'); } else { window.location.href = '/cart'; } }}>
        {!isPhoneView ? (
          <img src={searchIcon} alt="Search" className="search-icon" />
        ) : (
          <img src={cartIcon} alt="Cart" className="cart-icon" />
        )}
      </div>

      <input
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        aria-label="Search"
        value={searchTerm}
        onChange={handleInputChange}
      />

      <div className="icon-container" onClick={handleCartOrProfileClick} style={{ cursor: 'pointer' }}>
        <img src={isPhoneView ? profileIcon : cartIcon} alt={isPhoneView ? "Profile" : "Cart"} className="cart-icon" />
      </div>
    </form>
  );
};

export default SearchBar;
