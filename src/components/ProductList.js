import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SkeletonLoader from './SkeletonLoader';
import LazyImage from './LazyImage';
import './ProductList.css';
import './Favorites.css';

import ProductListPhone from './ProductListPhone';

import { truncateProductDescription, truncateProductName } from '../utils/textUtils';
import {
  getUserLocation,
  fetchLocationBasedProducts,
  fetchPopularProducts,
  showLocationPermissionDialog
} from '../utils/locationUtils';
import { CartContext } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { useFavorites } from '../contexts/FavoritesContext';


const ProductList = () => {
  const { showNotification } = useNotification();
  const { addToFavorites, removeFromFavorites, isFavorite, requireAuthForFavorites } = useFavorites();
  const [isPhoneView, setIsPhoneView] = useState(false);
  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { addToCart } = useContext(CartContext);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsPhoneView(window.innerWidth <= 600);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initializeProducts();
  }, []);

  const initializeProducts = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Clear localStorage location data if forcing refresh
      if (forceRefresh) {
        localStorage.removeItem('userLocation');
        localStorage.removeItem('locationPermission');
        localStorage.removeItem('locationPermissionLastAsked');
        localStorage.removeItem('locationPermissionShown');
        setLastRefresh(Date.now());
      }
      
      // Try to get user location and show permission dialog if needed
      const userLocation = await showLocationPermissionDialog();
      
      if (userLocation) {
        setLocation(userLocation);
        // Fetch location-based products with timestamp to prevent caching
        const timestamp = Date.now();
        const locationProducts = await fetchLocationBasedProducts(userLocation);
        // Load first 60 products initially
        const initialProducts = locationProducts.slice(0, 60);
        setProducts(initialProducts);
        setCurrentPage(2); // Set to page 2 since we already loaded first 60
        setHasMore(locationProducts.length > 60);
      } else {
        // Fallback to popular products with timestamp to prevent caching
        const timestamp = Date.now();
        const popularProducts = await fetchPopularProducts();
        // Load first 60 products initially
        const initialProducts = popularProducts.slice(0, 60);
        setProducts(initialProducts);
        setCurrentPage(2); // Set to page 2 since we already loaded first 60
        setHasMore(popularProducts.length > 60);
      }
    } catch (error) {
      console.error('Error initializing products:', error);
      // Fallback to all products if everything fails
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        // Load first 60 products initially
        const initialProducts = res.data.slice(0, 60);
        setProducts(initialProducts);
        setCurrentPage(2); // Set to page 2 since we already loaded first 60
        setHasMore(res.data.length > 60);
      } catch (fallbackError) {
        console.error('Fallback product fetch failed:', fallbackError);
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    initializeProducts(true); // Force refresh with true parameter
  };



  const loadMoreProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      const allProducts = res.data;
      const startIndex = (currentPage - 1) * 60;
      const endIndex = startIndex + 30;
      
      if (startIndex >= allProducts.length) {
        setHasMore(false);
        return;
      }

      const newProducts = allProducts.slice(startIndex, endIndex);
      setProducts(prevProducts => [...prevProducts, ...newProducts]);
      setCurrentPage(prevPage => prevPage + 1);
      
      // Check if there are more products to load
      if (endIndex >= allProducts.length) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    }
  };

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || !hasMore) {
      return;
    }
    loadMoreProducts();
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore]);

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

  if (isPhoneView) {
    return <ProductListPhone products={products} location={location} />;
  }

  if (isLoading) {
    return (
      <div className="product-list-wrapper">
        <Sidebar />
        <div className="product-list-container">
          <h1 className="product-list-title">PrimeGadgetZone Products</h1>
          <div className="product-list-grid">
            <SkeletonLoader type="product-card" count={12} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-list-wrapper">
      <Sidebar />
      <div className="product-list-container">
        <h1 className="product-list-title">
          {location ? `Popular in ${location}` : 'PrimeGadgetZone Products'}
        </h1>
        {location && (
          <div className="location-badge">
            📍 Showing recommendations for your area
          </div>
        )}
        <div className="product-list-grid">
          {products.length > 0 ? (
            products.map(product => (
              <Link to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`} key={product.id} className="product-card">
                <div className="product-image-container">
                  <LazyImage src={product.imageUrl} alt={product.name} />
                  {product.stock === 0 && (
                    <div className="out-of-stock-badge">
                      OUT OF STOCK
                    </div>
                  )}
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
                  <h3>{truncateProductName(product.name)}</h3>
                  <p className="product-description">{truncateProductDescription(product.description)}</p>
                  <div className="price-section">
                    {product.previousPrice && product.previousPrice > product.price ? (
                      <>
                        <span className="original-price">${product.previousPrice.toFixed(2)}</span>
                        <span className="current-price">${product.price.toFixed(2)}</span>
                        <span className="discount-badge">
                          {((product.previousPrice - product.price) / product.previousPrice) <= 0.05 ? 'Elite Choice' : `${Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)}% OFF`}
                        </span>
                      </>
                    ) : (
                      <span className="current-price">${product.price.toFixed(2)}</span>
                    )}
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
                  <div className="product-actions">
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button
                      className="buy-now-btn"
                      onClick={(e) => handleBuyNow(e, product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="no-products">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
