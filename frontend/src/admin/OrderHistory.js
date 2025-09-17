import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import PropTypes from 'prop-types';
import './AdminOrderHistory.css'; // Ensure this CSS is specific to admin order history and does not affect profile order history

const AdminOrderHistory = ({ statusFilter, readOnly = false, isAdmin = false }) => {
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
    if (isAdmin || user) {
      fetchUserOrders(user?.uid);
      fetchProducts();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user, statusFilter, isAdmin]);

const fetchUserOrders = async (userId, filterStatus) => {
    try {
      let url = isAdmin ? `http://localhost:5000/api/orders` : `http://localhost:5000/api/orders?userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      let filteredOrders = data;
      if (isAdmin) {
        // For admin, always show only delivered or canceled orders
        filteredOrders = data.filter(order => ['canceled', 'delivered'].includes(order.status));
      } else {
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
      }
      setOrders(filteredOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
        body: JSON.stringify({ status: 'shipping' }),
      });
      if (res.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'shipping' } : order
          )
        );
      } else {
        console.error('Failed to mark order as shipped');
      }
    } catch (error) {
      console.error('Error marking order as shipped:', error);
    }
  };

  if (!isAdmin && !user) {
    return <p>Please log in to view your orders.</p>;
  }

  if (loading) {
    return <p>Loading your orders...</p>;
  }

  if (orders.length === 0) {
    return <p>You have no orders.</p>;
  }

  return (
    <div className="profile-section admin-orders-section">
      <h1>
        {isAdmin ? 'Admin Order History' : (
          <>
            {statusFilter === 'returned' && 'My Returns'}
            {statusFilter === 'canceled' && 'My Cancellations'}
            {statusFilter === 'history' && 'Order History'}
            {!statusFilter && 'My Orders'}
          </>
        )}
      </h1>
      <div className="admin-filter-container">
        <label htmlFor="orderFilter">Filter Orders: </label>
      <select
        id="orderFilter"
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
            fetchUserOrders(isAdmin ? null : user.uid, 'delivered');
          } else if (value === 'canceled') {
            fetchUserOrders(isAdmin ? null : user.uid, 'canceled');
          } else {
            fetchUserOrders(isAdmin ? null : user.uid);
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
      <div className="admin-orders-table-container">
        <table className="admin-orders-table">
          <thead>
            <tr>
              <th data-label="Products">Products</th>
              <th data-label="Shipping Details">Shipping Details</th>
              <th data-label="Order ID">Order ID</th>
              <th data-label="Status">Status</th>
              <th data-label="Items & Total">Items & Total</th>
              <th data-label="Payment Method">Payment Method</th>
              <th data-label="Actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
                <tr key={order.id} className={`admin-order-table-row admin-beautiful-row ${order.status === 'canceled' ? 'admin-canceled-row' : ''} ${order.status === 'delivered' ? 'admin-delivered-row' : ''}`}>
                <td data-label="Products">
                  <ul className="admin-product-list">
                    {order.productDetails && order.productDetails.length > 0 ? order.productDetails.map(productDetail => {
                      const product = getProductById(productDetail.id);
                      if (!product) return <li key={productDetail.id}>Product ID: {productDetail.id} (Not found)</li>;
                      return (
                        <li key={productDetail.id} className="admin-product-list-item">
                          <img src={product.imageUrl} alt={product.name} className="admin-product-image" />
                          <div className="admin-product-info">
                            <div className="admin-product-name">{product.name}</div>
                            <div className="admin-product-id">ID: {product.id}</div>
                            <div className="admin-product-price">Price: ${product.price.toFixed(2)} <br></br> Total: ${(product.price * productDetail.quantity).toFixed(2)}</div>
                            <div className="admin-product-quantity">Quantity: {productDetail.quantity}</div>
                          </div>
                        </li>
                      );
                    }) : (order.productIds && order.productIds.length > 0 ? order.productIds.map(pid => {
                      const product = getProductById(pid);
                      if (!product) return <li key={pid}>Product ID: {pid} (Not found)</li>;
                      return (
                        <li key={pid} className="admin-product-list-item">
                          <img src={product.imageUrl} alt={product.name} className="admin-product-image" />
                          <div className="admin-product-info">
                            <div className="admin-product-name">{product.name}</div>
                            <div className="admin-product-id">ID: {product.id}</div>
                            <div className="admin-product-price">Price: ${product.price.toFixed(2)} <br></br> Total: ${(product.price * 1).toFixed(2)}</div>
                            <div className="admin-product-quantity">Quantity: 1</div>
                          </div>
                        </li>
                      );
                    }) : <li>No products found</li>)}
                  </ul>
                </td>
                <td data-label="Shipping Details">
                  {order.shippingAddress ? (
                    <div className="admin-shipping-details">
                      <div><strong>Full Name:</strong> {order.shippingAddress.fullName}</div>
                      <div><strong>Phone Number:</strong> {order.shippingAddress.phoneNumber}</div>
                      <div><strong>Building / House No / Floor / Street:</strong> {order.shippingAddress.building}</div>
                      <div><strong>Colony / Suburb / Locality / Landmark:</strong> {order.shippingAddress.colony}</div>
                      <div><strong>Region:</strong> {order.shippingAddress.region}</div>
                      <div><strong>City:</strong> {order.shippingAddress.city}</div>
                      <div><strong>Area:</strong> {order.shippingAddress.area}</div>
                      <div><strong>Address:</strong> {order.shippingAddress.address}</div>
                    </div>
                  ) : <div>No shipping details available.</div>}
                </td>
                <td data-label="Order ID">{order.id}</td>
                <td data-label="Status">{order.status}</td>
                <td data-label="Items & Total">
                  {order.productDetails ? 
                    `${order.productDetails.reduce((sum, item) => sum + (item.quantity || 1), 0)} items ($${order.productDetails.reduce((sum, item) => sum + ((item.quantity || 1) * (getProductById(item.id)?.price || 0)), 0).toFixed(2)})` : 
                    (order.productIds ? 
                      `${order.productIds.length} items ($${order.productIds.reduce((sum, pid) => sum + (getProductById(pid)?.price || 0), 0).toFixed(2)})` : 
                      '0 items ($0.00)')
                  }
                </td>
                <td data-label="Payment Method">{order.paymentMethod || 'N/A'}</td>
                <td data-label="Actions">
                      {!readOnly && (order.status === 'processing') ? (
                        <>
                          <button className="admin-btn-cancel admin-beautiful-btn" onClick={() => handleCancelOrder(order.id)}>Cancel Order</button>
                        </>
                      ) : (
                        order.status === 'canceled' ? <span className="admin-status-canceled">Order Canceled</span> : <span className="admin-status-delivered">Order {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrderHistory;
