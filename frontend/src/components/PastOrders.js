import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './PastOrders.css';

const PastOrders = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/orders');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const allOrders = await res.json();
        // Filter orders for the current user by userId and by status for past orders
        const userOrders = allOrders.filter(order => order.userId === userId && ['canceled', 'delivered'].includes(order.status));
        setOrders(userOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (orders.length === 0) {
    return <div>No recent orders found.</div>;
  }

  return (
    <div className="past-orders">
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-id">Order ID: {order.id}</div>
          <div className="order-items">
            {order.productDetails && order.productDetails.length > 0 ? (
              order.productDetails.map(productDetail => (
                <div key={productDetail.id} className="order-item">
                  <img src={productDetail.imageUrl} alt={productDetail.name} className="order-item-image" />
                  <div className="order-item-details">
                    <div className="order-item-name">{productDetail.name}</div>
                          <div className="product-price">price: ${product.price.toFixed(2)} <br></br> Total: ${(product.price * productDetail.quantity).toFixed(2)}</div>
                    <div className="order-item-quantity">Quantity: {productDetail.quantity}</div>
                  </div>
                </div>
              ))
            ) : (order.productIds && order.productIds.length > 0 ? (
              order.productIds.map(pid => {
                // We don't have product details in this case, so we'll just show the ID
                return (
                  <div key={pid} className="order-item">
                    <div className="order-item-details">
                      <div className="order-item-name">Product ID: {pid}</div>
                      <div className="order-item-quantity">Quantity: 1</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div>No items found in this order.</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PastOrders;
