 import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ProductList from './components/ProductList';
import BottomNavBar from './components/BottomNavBar';
import AdminPanel from './admin/AdminPanel';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import BannerHero from './components/BannerHero';
import SearchResults from './components/SearchResults';
import AISearchResults from './components/AISearchResults';
import CategoryProducts from './components/CategoryProducts';
import SearchBar from './components/SearchBar';
import CategoriesSection from './components/CategoriesSection';
import Chat from './components/Chat';
import Wishlist from './components/Wishlist';
import Favorites from './components/Favorites';
import Profile from './components/Profile';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import NavProfileDropdownRight from './components/NavProfileDropdownRight';
import NotificationDropdown from './components/NotificationDropdown';
import FAQHelpChat from './components/FAQHelpChat';
import PaymentGateway from './components/PaymentGateway';
import MyOrders from './components/myorders';

import AddressBookPhone from './components/AddressBookPhone';
import PaymentOptionsPhone from './components/PaymentOptionsPhone';
import MyOrdersPhone from './components/MyOrdersPhone';
import MyReturnsPhone from './components/MyReturnsPhone';
import MyCancellationsPhone from './components/MyCancellationsPhone';
import HistoryPhone from './components/HistoryPhone';

import './App.css';
import './Theme.css';
import { CartProvider } from './contexts/CartContext';
import { BannerProvider, BannerContext } from './contexts/BannerContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { FavoritesProvider } from './contexts/FavoritesContext';

function AppContent() {
  const location = useLocation();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { bannerImages, bannerText } = useContext(BannerContext);
  const { notification } = useNotification();

  const toggleCategories = () => {
    setCategoriesOpen(!categoriesOpen);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSuggestionsOpen(e.target.value.length > 0);
  };

  const suggestions = products
    .flatMap(product => [product.name, ...(product.tags || [])])
    .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  const handleLogin = (status) => {
    setIsLoggedIn(status);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };



  return (
    <CartProvider>
      <FavoritesProvider>
        <>
          <div className="background-effect"></div>

          <div className="mobile-only">
            {location.pathname === '/' && <SearchBar />}
          </div>
          {location.pathname !== '/admin' && (
            <nav className="nav desktop-nav">
               {/* Notification under nav bar */}
          {notification && (
            <div className={`notification notification-${notification.type} notification-under-nav`}>
              <div className="notification-content">
                <span className="notification-icon">✓</span>
                <span className="notification-message">{notification.message}</span>
              </div>
            </div>
          )}
              <div className="nav-left-group">
                <Link to="/" className="nav-link">PrimeGadgetZone</Link>
                <div
                  className="nav-link dropdown"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => setCategoriesOpen(false)}
                  onClick={toggleCategories}
                >
                  Categories
                  {categoriesOpen && (
                    <div className="dropdown-menu">
                      <Link to="/category/Fashion" className="dropdown-item">Fashion</Link>
                      <Link to="/category/Electronics" className="dropdown-item">Electronics</Link>
                      <Link to="/category/Home%20%26%20Garden" className="dropdown-item">Home & Garden</Link>
                      <Link to="/category/Books" className="dropdown-item">Books</Link>
                      <Link to="/category/Sports%20%26%20Outdoors" className="dropdown-item">Sports & Outdoors</Link>
                      <Link to="/category/Health%20%26%20Beauty" className="dropdown-item">Health & Beauty</Link>
                      <Link to="/category/Food%20%26%20Grocery" className="dropdown-item">Food & Grocery</Link>
                      <Link to="/category/Toys%20%26%20Games" className="dropdown-item">Toys & Games</Link>
                      <Link to="/category/Automotive" className="dropdown-item">Automotive</Link>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSearchSubmit} className="nav-search-form">
                  <input
                    type="text"
                    className="nav-search-input"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setSuggestionsOpen(searchTerm.length > 0)}
                    onBlur={() => setTimeout(() => setSuggestionsOpen(false), 200)}
                  />
                </form>
                {isLoggedIn && (
                  <Link to="/faq" className="nav-link">FAQ & Help</Link>
                )}
                <Link to="/favorites" className="nav-link">Favorites</Link>
                <Link to="/cart" className="nav-link">Cart</Link>
              </div>
              <NotificationDropdown />
              <NavProfileDropdownRight />
            </nav>
          )}
         
          {/* Render BottomNavBar on phone only */}
          <div className="mobile-only">
            <BottomNavBar />
          </div>
          <div className="main-content">
            {location.pathname === '/' && (
              <>
                <BannerHero bannerImages={bannerImages} bannerText={bannerText} />
                <CategoriesSection />
              </>
            )}
            <Routes>
              <Route path="/" element={
                <ProductList />
              } />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/ai-search" element={<AISearchResults />} />
              <Route path="/category/:categoryName" element={<CategoryProducts />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile/*" element={<Profile />} />
              <Route path="/profile/my-returns" element={<MyOrders statusFilter="returned" />} />
              <Route path="/profile/my-cancellations" element={<MyOrders statusFilter="canceled" />} />
              <Route path="/profile/history" element={<MyOrders statusFilter="history" />} />
              <Route path="/address-book" element={<AddressBookPhone />} />
              <Route path="/payment-options" element={<PaymentOptionsPhone />} />
              <Route path="/my-orders" element={<MyOrdersPhone />} />
              <Route path="/my-returns" element={<MyReturnsPhone />} />
              <Route path="/my-cancellations" element={<MyCancellationsPhone />} />
              <Route path="/history" element={<HistoryPhone />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onRegister={handleLogin} />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/faq" element={<FAQHelpChat />} />
              <Route path="/faq-user" element={<FAQHelpChat />} />
              <Route path="/payment" element={<PaymentGateway />} />
              <Route path="/myorders" element={<MyOrders />} />
            </Routes>
          </div>
        </>
      </FavoritesProvider>
    </CartProvider>
  );
}

function App() {
  return (
    <NotificationProvider>
      <BannerProvider>
        <Router>
          <AppContent />
        </Router>
      </BannerProvider>
    </NotificationProvider>
  );
}

export default App;
