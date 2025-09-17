import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';

import './MyOrdersPhone.css';

const MyOrdersPhone = ({ statusFilter }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user) {
      fetchUserOrders(user.uid);
      fetchProducts();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user, statusFilter]);

  const fetchUserOrders = async (userId, filterStatus) => {
    try {
      let url = `http://localhost:5000/api/orders?userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      let filteredOrders = data;
      if (filterStatus) {
        // Filter by the selected status from dropdown
        if (filterStatus === 'delivered') {
          filteredOrders = data.filter(order => order.status === 'delivered');
        } else if (filterStatus === 'canceled') {
          filteredOrders = data.filter(order => order.status === 'canceled');
        } else {
          // For other statuses, we might want to implement specific filtering logic
          // For now, we'll just return all orders for other statuses
          filteredOrders = data;
        }
      } else if (statusFilter) {
        // Filter by the statusFilter prop (used when component is first loaded or prop changes)
        if (statusFilter === 'history') {
          // Show only orders that are canceled or delivered
          const historyStatuses = ['canceled', 'delivered'];
          filteredOrders = data.filter(order => historyStatuses.includes(order.status));
        } else if (statusFilter === 'canceled') {
          filteredOrders = data.filter(order => order.status === 'canceled');
        } else if (statusFilter === 'delivered') {
          filteredOrders = data.filter(order => order.status === 'delivered');
        } else {
          filteredOrders = data.filter(order => order.status === statusFilter);
        }
      } else {
        // No statusFilter provided, show only orders not canceled or delivered (in process)
        filteredOrders = data.filter(order => order.status !== 'canceled' && order.status !== 'delivered');
      }
      setOrders(filteredOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const getProductById = (id) => {
    return products.find(product => product.id === id);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'canceled' }),
      });
      if (res.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'canceled' } : order
          )
        );
      } else {
        console.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'shipped' }),
      });
      if (res.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'shipped' } : order
          )
        );
      } else {
        console.error('Failed to mark order as shipped');
      }
    } catch (error) {
      console.error('Error marking order as shipped:', error);
    }
  };

  if (!user) {
    return <p>Please log in to view your orders.</p>;
  }

  if (loading) {
    return <p>Loading your orders...</p>;
  }

  if (orders.length === 0) {
    return <p>You have no orders.</p>;
  }

  return (
    <div className="orders-list-phone">
      <h1>
        {statusFilter === 'returned' && 'My Returns'}
        {statusFilter === 'canceled' && 'My Cancellations'}
        {statusFilter === 'history' && 'Order History'}
        {!statusFilter && 'My Orders'}
      </h1>
      <div className="filter-container-phone">
        <label htmlFor="orderFilterPhone">Filter Orders: </label>
          <select
            id="orderFilterPhone"
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'dateAsc') {
                setOrders((prevOrders) =>
                  [...prevOrders].sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate))
                );
              } else if (value === 'dateDesc') {
                setOrders((prevOrders) =>
                  [...prevOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                );
              } else if (value === 'delivered') {
                fetchUserOrders(user.uid, 'delivered');
              } else if (value === 'canceled') {
                fetchUserOrders(user.uid, 'canceled');
              } else {
                fetchUserOrders(user.uid);
              }
            }}
          >
            <option value="all">All</option>
            <option value="delivered">Delivered</option>
            <option value="canceled">Canceled</option>
            <option value="dateAsc">Date Ascending</option>
            <option value="dateDesc">Date Descending</option>
          </select>
      </div>
      {orders.map(order => (
        <div key={order.id} className="order-card-phone">
          <div className="order-products-phone">
            {order.productIds && order.productIds.length > 0 ? order.productIds.map(pid => {
              const product = getProductById(pid);
              if (!product) return <div key={pid}>Product ID: {pid} (Not found)</div>;
              return (
                <div key={pid} className="product-list-item-phone">
                  <img src={product.imageUrl} alt={product.name} className="product-image-phone" />
                  <div className="product-info-phone">
                    <div className="product-name-phone">{product.name}</div>
                    <div className="product-id-phone">{product.id}</div>
                  </div>
                </div>
              );
            }) : <div>No products found</div>}
          </div>
          <div className="shipping-details-phone">
            {order.shippingAddress ? (
              <>
                <div><strong>Full Name:</strong> {order.shippingAddress.fullName}</div>
                <div><strong>Phone Number:</strong> {order.shippingAddress.phoneNumber}</div>
                <div><strong>Building / House No / Floor / Street:</strong> {order.shippingAddress.building}</div>
                <div><strong>Colony / Suburb / Locality / Landmark:</strong> {order.shippingAddress.colony}</div>
                <div><strong>Region:</strong> {order.shippingAddress.region}</div>
                <div><strong>City:</strong> {order.shippingAddress.city}</div>
                <div><strong>Area:</strong> {order.shippingAddress.area}</div>
                <div><strong>Address:</strong> {order.shippingAddress.address}</div>
              </>
            ) : <div>No shipping details available.</div>}
          </div>
          <div className="order-meta-phone">
            <div><strong>Order ID:</strong> {order.id}</div>
            <div><strong>Status:</strong> {order.status === 'confirmed' ? 'processing' : order.status}</div>
            <div><strong>Price:</strong> ${order.totalPrice ? order.totalPrice.toFixed(2) : 'N/A'}</div>
            <div><strong>Payment Method:</strong> {order.paymentMethod || 'N/A'}</div>
              <div className="order-actions-phone">
          {order.status === 'processing' ? (
            <button className="btn-cancel-phone" onClick={() => handleCancelOrder(order.id)}>Cancel Order</button>
          ) : (
            order.status === 'canceled' ? <span className="status-canceled-phone">Order Canceled</span> : <span className="status-delivered-phone">Order {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
          )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyOrdersPhone;
