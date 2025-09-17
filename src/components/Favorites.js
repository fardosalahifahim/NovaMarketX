import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNotification } from '../contexts/NotificationContext';
import './Favorites.css';

const Favorites = () => {
  const { favorites, loading, toggleFavorite, isFavorite, requireAuthForFavorites } = useFavorites();
  const { showNotification } = useNotification();
  const [localFavorites, setLocalFavorites] = useState([]);

  useEffect(() => {
    setLocalFavorites(favorites);
  }, [favorites]);

  const handleToggleFavorite = async (product) => {
    if (!requireAuthForFavorites()) {
      return;
    }

    const success = await toggleFavorite(product);
    if (success) {
      if (isFavorite(product.id)) {
        showNotification(`${product.name} removed from favorites`, 'info');
      } else {
        showNotification(`${product.name} added to favorites`, 'success');
      }
    } else {
      showNotification('Failed to update favorite. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="favorites-wrapper">
        <div className="favorites-container">
          <div className="loading-spinner">Loading your favorites...</div>
        </div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="favorites-wrapper">
        <div className="favorites-container">
          <div className="empty-favorites">
            <span className="empty-favorites-icon">❤️</span>
            <h2>No Favorites Yet</h2>
            <p>You haven't added any products to your favorites.</p>
            <Link to="/" className="browse-products-btn">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-wrapper">
      <div className="favorites-container">
        <h2 className="favorites-title">Your Favorite Products</h2>
        <div className="favorites-grid">
          {localFavorites.map(product => (
            <div key={product.id} className="favorite-card">
              <div className="favorite-image-container">
                <Link to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`}>
                  <img src={product.imageUrl} alt={product.name} className="favorite-image" />
                </Link>
                <button
                  className={`favorite-badge ${isFavorite(product.id) ? 'favorited' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite(product);
                  }}
                  title={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg
                    className="favorite-icon"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <div className="favorite-info">
                <Link to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`}>
                  <h3>{product.name}</h3>
                </Link>
                <p className="favorite-description">{product.description}</p>
                <div className="price-section">
                  <span className="current-price">${product.price.toFixed(2)}</span>
                </div>
                {(product.maxBuyers || product.maxPerPerson) && (
                  <div className="purchase-limits">
                    {product.maxBuyers && product.maxBuyers > 0 && (
                      <span className="limit-info">{`Only ${product.maxBuyers} left in stock`}</span>
                    )}
                    {product.maxBuyers === 0 && (
                      <span className="limit-info out-of-stock">Out of stock</span>
                    )}
                    {product.maxPerPerson && (
                      <span className="limit-info" style={{display: 'block'}}>Max Per Person: {product.maxPerPerson}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
