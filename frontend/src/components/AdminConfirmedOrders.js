import React, { useEffect, useState } from 'react';

const AdminConfirmedOrders = ({ products }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    fetchConfirmedOrders();
  }, []);

  const fetchConfirmedOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders');
      const data = await res.json();
      const confirmedOrders = data.filter(order => order.status === 'confirmed');
      setOrders(confirmedOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching confirmed orders:', error);
      setLoading(false);
    }
  };

  const getProductById = (id) => {
    if (!products || products.length === 0) return null;
    return products.find(product => product.id === id);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update order status:', response.status, errorText);
        throw new Error(`Failed to update order status: ${response.status} ${errorText}`);
      }
      fetchConfirmedOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleCancel = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      updateOrderStatus(orderId, 'canceled');
    }
  };

  const openShipModal = (orderId) => {
    setSelectedOrderId(orderId);
    setShowShipModal(true);
  };

  const closeShipModal = () => {
    setSelectedOrderId(null);
    setShowShipModal(false);
  };

  const confirmShip = () => {
    if (selectedOrderId) {
      updateOrderStatus(selectedOrderId, 'shipping');
      closeShipModal();
    }
  };

  if (loading) {
    return <p>Loading confirmed orders...</p>;
  }

  if (orders.length === 0) {
    return <p>No confirmed orders found.</p>;
  }

  return (
    <div>
      <h1>Confirmed Orders</h1>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Products</th>
            <th>Shipping Details</th>
            <th>Order ID</th>
            <th>User ID</th>
            <th>Status</th>
            <th>Price</th>
          
            <th>Payment Method</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>
                <ul className="product-list">
                  {order.productDetails && order.productDetails.length > 0 ? order.productDetails.map(productDetail => {
                    const product = getProductById(productDetail.id);
                    if (!product) return <li key={productDetail.id}>Product ID: {productDetail.id} (Not found)</li>;
                    return (
                      <li key={productDetail.id} className="product-list-item">
                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                        <div className="product-info">
                          <div className="product-name">{product.name}</div>
                          <div className="product-id">ID: {product.id}</div>
                          <div className="product-price">price: ${product.price.toFixed(2)} <br></br> Total: ${(product.price * productDetail.quantity).toFixed(2)}</div>
                          <div className="product-quantity">Quantity: {productDetail.quantity}</div>
                        </div>
                      </li>
                    );
                  }) : (order.productIds && order.productIds.length > 0 ? order.productIds.map(pid => {
                    const product = getProductById(pid);
                    if (!product) return <li key={pid}>Product ID: {pid} (Not found)</li>;
                    return (
                      <li key={pid} className="product-list-item">
                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                        <div className="product-info">
                          <div className="product-name">{product.name}</div>
                          <div className="product-id">ID: {product.id}</div>
                          <div className="product-price">Price: ${product.price.toFixed(2)} <br></br> Total: ${(product.price * 1).toFixed(2)}</div>
                          <div className="product-quantity">Quantity: 1</div>
                        </div>
                      </li>
                    );
                  }) : <li>No products found</li>)}
                </ul>
              </td>
              <td>
                {order.shippingAddress ? (
                  <div className="shipping-details">
                    <div><strong>Full Name:</strong> {order.shippingAddress.fullName}</div>
                    <div><strong>Phone Number:</strong> {order.shippingAddress.phoneNumber}</div>
                    <div><strong>Building / House No / Floor / Street:</strong> {order.shippingAddress.building}</div>
                    <div><strong>Colony / Suburb / Locality / Landmark:</strong> {order.shippingAddress.colony}</div>
                    <div><strong>Region:</strong> {order.shippingAddress.region}</div>
                    <div><strong>City:</strong> {order.shippingAddress.city}</div>
                    <div><strong>Area:</strong> {order.shippingAddress.area}</div>
                    <div><strong>Address:</strong> {order.shippingAddress.address}</div>
                  </div>
                ) : <div>No shipping address</div>}
              </td>
              <td>{order.id}</td>
              <td>{order.userId}</td>
              <td>{order.status}</td>
             
              <td>
                {order.productDetails ? 
                  `${order.productDetails.reduce((sum, item) => sum + (item.quantity || 1), 0)} items ($${order.productDetails.reduce((sum, item) => sum + ((item.quantity || 1) * (getProductById(item.id)?.price || 0)), 0).toFixed(2)})` : 
                  (order.productIds ? 
                    `${order.productIds.length} items ($${order.productIds.reduce((sum, pid) => sum + (getProductById(pid)?.price || 0), 0).toFixed(2)})` : 
                    '0 items ($0.00)')
                }
              </td>
              <td>{order.paymentMethod || 'N/A'}</td>
              <td>
                <button className="btn-cancel" onClick={() => handleCancel(order.id)}>Cancel</button>
                <button className="btn-shipped beautiful-btn enhanced-btn" onClick={() => openShipModal(order.id)}>Shipped</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showShipModal && (
        <div className="modal-overlay beautiful-modal-overlay">
          <div className="modal-content beautiful-modal-content">
            <h3>Confirm Shipping</h3>
            <p>Are you sure you want to mark this order as shipped?</p>
            <div className="modal-buttons">
              <button className="btn-confirm beautiful-btn-confirm" onClick={confirmShip}>Yes</button>
              <button className="btn-cancel beautiful-btn-cancel" onClick={closeShipModal}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConfirmedOrders;
