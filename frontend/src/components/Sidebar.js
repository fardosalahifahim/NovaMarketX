import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import './Sidebar.css';

const Sidebar = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const { favorites } = useFavorites();

  // Check if we're on the favorites page
  const isFavoritesPage = location.pathname === '/favorites';

  useEffect(() => {
    fetchFeaturedProducts();
    adjustSidebarHeight();
    
    // Add resize listener to adjust height when window size changes
    window.addEventListener('resize', adjustSidebarHeight);
    
    return () => {
      window.removeEventListener('resize', adjustSidebarHeight);
    };
  }, []);

  const adjustSidebarHeight = () => {
    const sidebar = sidebarRef.current;
    const productListContainer = document.querySelector('.product-list-container');

    if (sidebar && productListContainer) {
      // Set sidebar height to match product list container height
      const productListHeight = productListContainer.offsetHeight;
      sidebar.style.height = `${productListHeight}px`;
      
      // Calculate how many products can fit in the available space
      calculateAndLoadProducts(productListHeight);
    }
  };

  const calculateAndLoadProducts = async (availableHeight) => {
    try {
      const productListRes = await fetch('http://localhost:5000/api/products');
      const allProducts = await productListRes.json();
      
      // Calculate available space for products (subtract categories section height)
      const categoriesSectionHeight = 300; // Approximate height of categories section
      const productsAvailableHeight = availableHeight - categoriesSectionHeight - 100; // Additional padding
      
      // Calculate how many products can fit (each product item is ~80px tall)
      const productItemHeight = 80;
      const maxProductsToShow = Math.floor(productsAvailableHeight / productItemHeight);
      
      // Ensure we show at least 1 product and at most all available products
      const productsToShow = Math.max(1, Math.min(allProducts.length, maxProductsToShow));
      
      // Shuffle products randomly to get different ones
      const shuffledProducts = [...allProducts].sort(() => Math.random() - 0.5);
      
      // Select the number of products to show
      const selectedProducts = shuffledProducts.slice(0, productsToShow);
      
      setFeaturedProducts(selectedProducts);
    } catch (error) {
      console.error('Error calculating and loading products:', error);
    }
  };

  const loadMoreFeaturedProducts = async () => {
    try {
      const productListRes = await fetch('http://localhost:5000/api/products');
      const allProducts = await productListRes.json();
      const startIndex = (currentPage - 1) * 60;
      const endIndex = startIndex + 30;
      
      if (startIndex >= allProducts.length) {
        setHasMore(false);
        return;
      }

      const newProducts = allProducts.slice(startIndex, endIndex);
      setFeaturedProducts(prevProducts => [...prevProducts, ...newProducts]);
      setCurrentPage(prevPage => prevPage + 1);
      
      // Check if there are more products to load
      if (endIndex >= allProducts.length) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more featured products:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const productListRes = await fetch('http://localhost:5000/api/products');
      const allProducts = await productListRes.json();
      
      // Load first 60 products initially
      const initialProducts = allProducts.slice(0, 60);
      setFeaturedProducts(initialProducts);
      setCurrentPage(2); // Set to page 2 since we already loaded first 60
      setHasMore(allProducts.length > 60);
      
      // Adjust sidebar height after products are loaded
      setTimeout(adjustSidebarHeight, 100);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <aside className="sidebar" ref={sidebarRef}>
      <div className="sidebar-section">
        <h3>Categories</h3>
        <ul className="category-list">
          <li><Link to="/category/Fashion">Fashion</Link></li>
          <li><Link to="/category/Electronics">Electronics</Link></li>
          <li><Link to="/category/Home%20%26%20Garden">Home & Garden</Link></li>
          <li><Link to="/category/Books">Books</Link></li>
          <li><Link to="/category/Sports%20%26%20Outdoors">Sports & Outdoors</Link></li>
          <li><Link to="/category/Health%20%26%20Beauty">Health & Beauty</Link></li>
          <li><Link to="/category/Food%20%26%20Grocery">Food & Grocery</Link></li>
          <li><Link to="/category/Toys%20%26%20Games">Toys & Games</Link></li>
          <li><Link to="/category/Automotive">Automotive</Link></li>
        </ul>
      </div>
      <div className="sidebar-section">
        <h3>{isFavoritesPage ? 'Your Favorites' : 'Featured Products'}</h3>
        <ul className="best-sellers-list">
          {isFavoritesPage ? (
            // Show only 5 favorite products
            favorites.length === 0 ? (
              <li>No favorites yet</li>
            ) : (
              favorites.slice(0, 5).map(product => (
                <li key={product.id}>
                  <Link to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`} className="featured-product-link">
                    <div className="image-container">
                      <img src={product.imageUrl} alt={product.name} />
                      {product.tier && (() => {
                        if (product.tier === 'Premium') {
                          return <span className="premium-badge">Premium</span>;
                        } else if (product.tier === 'Cheap') {
                          return <span className="cheap-badge">Cheap</span>;
                        } else if (product.tier === 'Medium') {
                          return <span className="medium-badge">Medium</span>;
                        }
                      })()}
                    </div>
                    <div className="best-seller-info">
                      <span>{product.name}</span>
                      <span className="price">
                        {product.previousPrice && product.previousPrice > product.price && (
                          <span className="previous-price">${product.previousPrice.toFixed(2)}</span>
                        )}
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            )
          ) : (
            // Show featured products for other pages
            featuredProducts.length === 0 ? (
              <li>Loading...</li>
            ) : (
              featuredProducts.map(product => (
                <li key={product.id}>
                  <Link to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`} className="featured-product-link">
                    <div className="image-container">
                      <img src={product.imageUrl} alt={product.name} />
                      {product.tier && (() => {
                        if (product.tier === 'Premium') {
                          return <span className="premium-badge">Premium</span>;
                        } else if (product.tier === 'Cheap') {
                          return <span className="cheap-badge">Cheap</span>;
                        } else if (product.tier === 'Medium') {
                          return <span className="medium-badge">Medium</span>;
                        }
                      })()}
                    </div>
                    <div className="best-seller-info">
                      <span>{product.name}</span>
                      <span className="price">
                        {product.previousPrice && product.previousPrice > product.price && (
                          <span className="previous-price">${product.previousPrice.toFixed(2)}</span>
                        )}
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            )
          )}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
