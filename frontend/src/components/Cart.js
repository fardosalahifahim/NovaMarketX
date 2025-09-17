import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import './Cart.css';
import { CartContext } from '../contexts/CartContext';
import axios from 'axios';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity } = useContext(CartContext);
  const [productsMap, setProductsMap] = useState({});
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        const productsArray = res.data;
        const map = {};
        productsArray.forEach(product => {
          map[product.id] = product;
        });
        setProductsMap(map);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    }
  }, []);

  const handleProceedToCheckout = () => {
    const productIds = cartItems.map(item => item.id).join(',');
    const checkoutUrl = `/checkout?userId=${userId || ''}&productIds=${productIds}`;
    navigate(checkoutUrl, { state: { fromCart: true } });
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    return imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl}`;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const handleQuantityChange = (product, newQuantity) => {
    const fullProduct = productsMap[product.id] || {};
    const maxStock = fullProduct.stock || Infinity;

    if (newQuantity > maxStock) {
      alert(`Cannot add more than ${maxStock} items. Only ${maxStock} left in stock.`);
      return;
    }

    if (newQuantity <= 0) {
      const confirmRemove = window.confirm(`Remove ${product.name} from cart?`);
      if (!confirmRemove) return;
    }

    updateQuantity(product.id, newQuantity);
  };

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-cards-container">
          {cartItems.map((product) => {
            const fullProduct = productsMap[product.id] || {};
            const imageUrl = fullProduct.imageUrl || product.imageUrl || '';
            return (
              <div key={product.id} className="cart-card">
                <div className="cart-image-container">
                  <img src={getImageUrl(imageUrl)} alt={product.name} className="cart-image" />
                </div>
                <div className="cart-details">
                  <h3 className="cart-product-name">{product.name}</h3>
                  <p className="cart-product-id">ID: {product.id}</p>
                  <p className="cart-product-price">${product.price !== undefined && product.price !== null ? product.price.toFixed(2) : 'N/A'}</p>
                  <div className="cart-quantity-controls">
                    <button className="quantity-btn" onClick={() => handleQuantityChange(product, product.quantity - 1)}>-</button>
                    <span className="quantity-display">{product.quantity}</span>
                    <button className="quantity-btn" onClick={() => handleQuantityChange(product, product.quantity + 1)}>+</button>
                  </div>
                  <button className="cart-item-delete" onClick={() => removeFromCart(product.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {cartItems.length > 0 && (
        <div className="cart-total">
          <h3>Total: ${calculateTotal().toFixed(2)}</h3>
        </div>
      )}
      <button className="proceed-checkout-button" onClick={handleProceedToCheckout} disabled={cartItems.length === 0}>
        Proceed to Checkout
      </button>
    </div>
  );
};

export default Cart;
