import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './ProductListPhone.css';
import './Favorites.css';
import { truncateProductName } from '../utils/textUtils';
import { CartContext } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { useFavorites } from '../contexts/FavoritesContext';

const ProductListPhone = ({ products: initialProducts, location }) => {
  const [products, setProducts] = useState(initialProducts.slice(0, 12));
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length > 12);
  const [lastStockUpdate, setLastStockUpdate] = useState(null);
  const observer = useRef();
  const { addToCart } = useContext(CartContext);
  const { showNotification } = useNotification();
  const { addToFavorites, removeFromFavorites, isFavorite, requireAuthForFavorites } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    // Always limit to 12 products for mobile initially
    setProducts(initialProducts.slice(0, 12));
    setHasMore(initialProducts.length > 12);
  }, [initialProducts]);

  // Function to fetch current stock data for products
  const fetchCurrentStockData = useCallback(async () => {
    if (products.length === 0) return;

    try {
      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          try {
            const response = await fetch(`http://localhost:5000/api/products/id/${product.id}`);
            if (response.ok) {
              const currentProductData = await response.json();
              // Update stock, maxBuyers, and maxPerPerson with current data
              return {
                ...product,
                stock: currentProductData.stock,
                maxBuyers: currentProductData.maxBuyers,
                maxPerPerson: currentProductData.maxPerPerson,
                outOfStockDate: currentProductData.outOfStockDate
              };
            }
            return product; // Return original if fetch fails
          } catch (error) {
            console.error(`Error fetching stock data for product ${product.id}:`, error);
            return product; // Return original if fetch fails
          }
        })
      );

      setProducts(updatedProducts);
      setLastStockUpdate(new Date().toISOString());
      console.log('Updated mobile products with real-time stock data');
    } catch (error) {
      console.error('Error updating stock data:', error);
    }
  }, [products]);

  // Update stock data periodically (every 30 seconds)
  useEffect(() => {
    if (products.length === 0) return;

    // Initial stock update
    fetchCurrentStockData();

    // Set up periodic updates
    const intervalId = setInterval(fetchCurrentStockData, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [products.length, fetchCurrentStockData]);

  const loadMoreProducts = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const currentLength = products.length;
      const nextProducts = initialProducts.slice(0, currentLength + 8);
      setProducts(nextProducts);
      setHasMore(nextProducts.length < initialProducts.length);
      setIsLoading(false);
    }, 300);
  }, [products.length, initialProducts]);

  const lastProductElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreProducts();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMoreProducts]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      color: product.color || '',
      size: product.size || ''
    });
    showNotification(`${product.name} added to cart!`, 'success');
  };

  const handleBuyNow = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      color: product.color || '',
      size: product.size || ''
    });
    navigate('/cart');
  };

  return (
    <div className="product-list-wrapper no-background">
      <Sidebar />
      <div className="product-list-container no-background">
        <h1 className="product-list-title">
          {location ? `Popular in ${location}` : 'PrimeGadgetZone Products'}
        </h1>
        {location && (
          <div className="location-badge">
            📍 Your area
          </div>
        )}
        <div className="product-list-grid">
          {isLoading && (
            <div className="beautiful-loading-placeholder">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="beautiful-loading-item">
                  <div className="beautiful-loading-image"></div>
                  <div className="beautiful-loading-text"></div>
                  <div className="beautiful-loading-text"></div>
                </div>
              ))}
            </div>
          )}
          {products.length > 0 ? (
            products.map((product, index) => {
              if (index === products.length - 1) {
                return (
                  <Link
                    ref={lastProductElementRef}
                    to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`}
                    key={product.id}
                    className="product-card glass-card"
                  >
                    <div className="product-image-container">
                      <img src={product.imageUrl} alt={product.name} />
                      {product.tier && (
                        <div className={`tier-badge tier-${product.tier.toLowerCase()}`}>
                          {product.tier}
                        </div>
                      )}
                      {product.status && product.status !== 'Active' && (
                        <div className={`status-badge status-${product.status.toLowerCase()}`}>
                          {product.status}
                        </div>
                      )}
                      <button
                        className={`favorite-badge ${isFavorite(product.id) ? 'favorited' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isFavorite(product.id)) {
                            removeFromFavorites(product.id);
                            showNotification(`${product.name} removed from favorites`, 'info');
                          } else {
                            const success = addToFavorites(product);
                            if (success) {
                              showNotification(`${product.name} added to favorites`, 'success');
                            }
                          }
                        }}
                        title={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg
                          className="favorite-icon-small"
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
                    <div className="product-info">
                      <h3>{truncateProductName(product.name, 30)}</h3>
                      <div className="price-section">
                        {product.previousPrice && product.previousPrice > product.price ? (
                          <>
                            <span className="original-price">${product.previousPrice.toFixed(2)}</span>
                            <span className="current-price">${product.price.toFixed(2)}</span>
                            <span className="discount-badge">
                              {Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="current-price">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                      {(product.maxBuyers || product.maxPerPerson) && (
                        <div className="purchase-limits">
                          {product.maxBuyers && (
                            <span className="limit-info">Max: {product.maxBuyers}</span>
                          )}
                          {product.maxPerPerson && (
                            <span className="limit-info">Per Person: {product.maxPerPerson}</span>
                          )}
                        </div>
                      )}
                      {product.categories && product.categories.length > 0 && (
                        <div className="product-categories">
                          {product.categories.slice(0, 1).map((category, index) => (
                            <span key={index} className="category-tag">{category}</span>
                          ))}
                        </div>
                      )}
                      <div className="product-actions">
                        <button className="add-to-cart-btn" onClick={(e) => handleAddToCart(e, product)}>
                          Add to Cart
                        </button>
                        <button className="buy-now-btn" onClick={(e) => handleBuyNow(e, product)}>
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              } else {
                return (
                  <Link
                    to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`}
                    key={product.id}
                    className="product-card glass-card"
                  >
                    <div className="product-image-container">
                      <img src={product.imageUrl} alt={product.name} />
                      {product.tier && (
                        <div className={`tier-badge tier-${product.tier.toLowerCase()}`}>
                          {product.tier}
                        </div>
                      )}
                      {product.status && product.status !== 'Active' && (
                        <div className={`status-badge status-${product.status.toLowerCase()}`}>
                          {product.status}
                        </div>
                      )}
                      <button
                        className={`favorite-badge ${isFavorite(product.id) ? 'favorited' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isFavorite(product.id)) {
                            removeFromFavorites(product.id);
                            showNotification(`${product.name} removed from favorites`, 'info');
                          } else {
                            const success = addToFavorites(product);
                            if (success) {
                              showNotification(`${product.name} added to favorites`, 'success');
                            }
                          }
                        }}
                        title={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg
                          className="favorite-icon-small"
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
                    <div className="product-info">
                      <h3>{truncateProductName(product.name, 30)}</h3>
                      <div className="price-section">
                        {product.previousPrice && product.previousPrice > product.price ? (
                          <>
                            <span className="original-price">${product.previousPrice.toFixed(2)}</span>
                            <span className="current-price">${product.price.toFixed(2)}</span>
                            <span className="discount-badge">
                              {Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="current-price">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                      {(product.maxBuyers || product.maxPerPerson) && (
                        <div className="purchase-limits">
                          {product.maxBuyers && (
                            <span className="limit-info">Max: {product.maxBuyers}</span>
                          )}
                          {product.maxPerPerson && (
                            <span className="limit-info">Per Person: {product.maxPerPerson}</span>
                          )}
                        </div>
                      )}
                      {product.categories && product.categories.length > 0 && (
                        <div className="product-categories">
                          {product.categories.slice(0, 1).map((category, index) => (
                            <span key={index} className="category-tag">{category}</span>
                          ))}
                        </div>
                      )}
                      <div className="product-actions">
                        <button className="add-to-cart-btn" onClick={(e) => handleAddToCart(e, product)}>
                          Add to Cart
                        </button>
                        <button className="buy-now-btn" onClick={(e) => handleBuyNow(e, product)}>
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              }
            })
          ) : (
            <div className="no-products">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
        {hasMore && (
          <div className="load-more-container">
            <button 
              className="load-more-btn" 
              onClick={loadMoreProducts}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More Products'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPhone;
