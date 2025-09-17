import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MobileSearchBar.css';

import searchIcon from '../icons/Nav-icon/search.png';
import cameraIcon from '../icons/Nav-icon/message.png'; // Placeholder for camera icon
import cartIcon from '../icons/Nav-icon/card.png';

const MobileSearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="mobile-search-bar">
      <form onSubmit={handleSubmit} className="mobile-search-form">
        <button type="button" className="icon-button search-icon">
          <img src={searchIcon} alt="Search" />
        </button>
        <input
          type="text"
          className="mobile-search-input"
          placeholder="Search"
          value={searchTerm}
          onChange={handleInputChange}
        />
        <button type="button" className="icon-button camera-icon">
          <img src={cameraIcon} alt="Camera" />
        </button>
      </form>
      <button className="icon-button cart-icon" onClick={() => navigate('/cart')}>
        <img src={cartIcon} alt="Cart" />
      </button>
    </div>
  );
};

export default MobileSearchBar;
