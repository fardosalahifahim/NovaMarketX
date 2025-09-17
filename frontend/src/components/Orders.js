import React, { useState } from 'react';
import './Orders.css';

const Orders = ({ orders, products = [], onDeleteOrder, isProfileOrders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('orderId');
  const [statusFilter, setStatusFilter] = useState('all');

  // Helper to get product details by id
  const getProductById = (id) => {
    if (!products || products.length === 0) return null;
    return products.find(product => product.id === id);
  };

  // Allowed statuses to show
  const allowedStatuses = ['canceled', 'pending', 'delivered', 'confirmed', 'shipping'];

  // Filter orders based on search term, selected field, and status filter (case-insensitive, partial match)
  let filteredOrders = orders.filter(order => {
    const lowerSearch = searchTerm.toLowerCase();

    // Filter by statusFilter dropdown
    if (statusFilter === 'canceled' && order.status.toLowerCase() !== 'canceled') return false;
    if (statusFilter === 'history' && !['canceled', 'delivered'].includes(order.status.toLowerCase())) return false;
    if (statusFilter === 'delivered' && order.status.toLowerCase() !== 'delivered') return false;

    switch (searchField) {
      case 'orderId':
        return order.id.toString().toLowerCase().includes(lowerSearch);
      case 'userId':
        return order.userId.toString().toLowerCase().includes(lowerSearch);
      case 'productId':
        return order.productIds && order.productIds.some(pid => pid.toString().toLowerCase().includes(lowerSearch));
      case 'phoneNumber':
        return order.shippingAddress && order.shippingAddress.phoneNumber && order.shippingAddress.phoneNumber.toLowerCase().includes(lowerSearch);
      case 'status':
        return order.status && order.status.toLowerCase().includes(lowerSearch);
      default:
        return true;
    }
  });

  // Deduplicate orders by order id
  const uniqueOrdersMap = new Map();
  filteredOrders.forEach(order => {
    if (!uniqueOrdersMap.has(order.id)) {
      uniqueOrdersMap.set(order.id, order);
    }
  });
  filteredOrders = Array.from(uniqueOrdersMap.values());

  const [orderStatuses, setOrderStatuses] = useState(
    orders.reduce((acc, order) => {
      acc[order.id] = order.status;
      return acc;
    }, {})
  );

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Log the request details for debugging
      console.log(`Updating order ${orderId} status to ${newStatus}`);
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
      setOrderStatuses(prev => ({ ...prev, [orderId]: newStatus }));
      if (typeof onOrderStatusChange === 'function') {
        onOrderStatusChange();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleConfirm = (orderId) => {
    // Use a modal popup for confirmation with improved styling
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';

    const popup = document.createElement('div');
    popup.style.backgroundColor = '#fefefe';
    popup.style.padding = '30px 40px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    popup.style.textAlign = 'center';
    popup.style.minWidth = '320px';
    popup.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to confirm this order?';
    message.style.fontSize = '18px';
    message.style.marginBottom = '25px';
    message.style.color = '#333';

    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Confirm';
    btnConfirm.style.margin = '0 15px';
    btnConfirm.style.padding = '10px 25px';
    btnConfirm.style.border = 'none';
    btnConfirm.style.borderRadius = '6px';
    btnConfirm.style.backgroundColor = '#4CAF50';
    btnConfirm.style.color = 'white';
    btnConfirm.style.fontWeight = '600';
    btnConfirm.style.cursor = 'pointer';
    btnConfirm.style.fontSize = '16px';
    btnConfirm.style.boxShadow = '0 4px 10px rgba(76, 175, 80, 0.4)';
    btnConfirm.onmouseover = () => btnConfirm.style.backgroundColor = '#45a049';
    btnConfirm.onmouseout = () => btnConfirm.style.backgroundColor = '#4CAF50';
    btnConfirm.onclick = () => {
      updateOrderStatus(orderId, 'confirmed');
      document.body.removeChild(modal);
    };

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancel';
    btnCancel.style.margin = '0 15px';
    btnCancel.style.padding = '10px 25px';
    btnCancel.style.border = 'none';
    btnCancel.style.borderRadius = '6px';
    btnCancel.style.backgroundColor = '#f44336';
    btnCancel.style.color = 'white';
    btnCancel.style.fontWeight = '600';
    btnCancel.style.cursor = 'pointer';
    btnCancel.style.fontSize = '16px';
    btnCancel.style.boxShadow = '0 4px 10px rgba(244, 67, 54, 0.4)';
    btnCancel.onmouseover = () => btnCancel.style.backgroundColor = '#da190b';
    btnCancel.onmouseout = () => btnCancel.style.backgroundColor = '#f44336';
    btnCancel.onclick = () => {
      document.body.removeChild(modal);
    };

    popup.appendChild(message);
    popup.appendChild(btnConfirm);
    popup.appendChild(btnCancel);
    modal.appendChild(popup);
    document.body.appendChild(modal);
  };

  const handleShipping = (orderId) => {
    updateOrderStatus(orderId, 'shipping');
  };

  const handleCancel = async (orderId) => {
    if (isProfileOrders && orderStatuses[orderId] === 'confirmed') {
      alert('Confirmed orders cannot be canceled.');
      return;
    }
    // Show confirmation modal before canceling
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';

    const popup = document.createElement('div');
    popup.style.backgroundColor = '#fefefe';
    popup.style.padding = '30px 40px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    popup.style.textAlign = 'center';
    popup.style.minWidth = '320px';
    popup.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to cancel this order?';
    message.style.fontSize = '18px';
    message.style.marginBottom = '25px';
    message.style.color = '#333';

    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Cancel Order';
    btnConfirm.style.margin = '0 15px';
    btnConfirm.style.padding = '10px 25px';
    btnConfirm.style.border = 'none';
    btnConfirm.style.borderRadius = '6px';
    btnConfirm.style.backgroundColor = '#f44336';
    btnConfirm.style.color = 'white';
    btnConfirm.style.fontWeight = '600';
    btnConfirm.style.cursor = 'pointer';
    btnConfirm.style.fontSize = '16px';
    btnConfirm.style.boxShadow = '0 4px 10px rgba(244, 67, 54, 0.4)';
    btnConfirm.onmouseover = () => btnConfirm.style.backgroundColor = '#da190b';
    btnConfirm.onmouseout = () => btnConfirm.style.backgroundColor = '#f44336';
    btnConfirm.onclick = async () => {
      try {
        await updateOrderStatus(orderId, 'canceled');
        console.log(`Order ${orderId} canceled successfully`);
        if (typeof onOrderStatusChange === 'function') {
          onOrderStatusChange();
        }
      } catch (error) {
        console.error(`Failed to cancel order ${orderId}:`, error);
        alert('Failed to cancel order');
      }
      document.body.removeChild(modal);
    };

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Keep Order';
    btnCancel.style.margin = '0 15px';
    btnCancel.style.padding = '10px 25px';
    btnCancel.style.border = 'none';
    btnCancel.style.borderRadius = '6px';
    btnCancel.style.backgroundColor = '#4CAF50';
    btnCancel.style.color = 'white';
    btnCancel.style.fontWeight = '600';
    btnCancel.style.cursor = 'pointer';
    btnCancel.style.fontSize = '16px';
    btnCancel.style.boxShadow = '0 4px 10px rgba(76, 175, 80, 0.4)';
    btnCancel.onmouseover = () => btnCancel.style.backgroundColor = '#45a049';
    btnCancel.onmouseout = () => btnCancel.style.backgroundColor = '#4CAF50';
    btnCancel.onclick = () => {
      document.body.removeChild(modal);
    };

    popup.appendChild(message);
    popup.appendChild(btnConfirm);
    popup.appendChild(btnCancel);
    modal.appendChild(popup);
    document.body.appendChild(modal);
  };

  const handleDelivered = (orderId) => {
    // Use a modal popup instead of window.confirm for better UI
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const popup = document.createElement('div');
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    popup.style.textAlign = 'center';

    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to mark this order as delivered?';

    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Confirm';
    btnConfirm.style.margin = '10px';
    btnConfirm.onclick = () => {
      updateOrderStatus(orderId, 'delivered');
      document.body.removeChild(modal);
      // Optionally, trigger a refresh or callback to update UI after status change
      if (typeof window.refreshOrders === 'function') {
        window.refreshOrders();
      }
    };

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancel';
    btnCancel.style.margin = '10px';
    btnCancel.onclick = () => {
      document.body.removeChild(modal);
    };

    popup.appendChild(message);
    popup.appendChild(btnConfirm);
    popup.appendChild(btnCancel);
    modal.appendChild(popup);
    document.body.appendChild(modal);
  };

  return (
    <div>
      <h1 id="orders">{isProfileOrders ? 'Profile Orders' : 'Orders'}</h1>
      <div className="order-search-container">
        <input
          type="text"
          placeholder="Search orders"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="order-search-input"
        />
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          className="order-search-select"
        >
          <option value="orderId">Order ID</option>
          <option value="userId">User ID</option>
          <option value="productId">Product ID</option>
          <option value="phoneNumber">Phone Number</option>
          <option value="status">Status</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="order-status-filter"
          style={{ marginLeft: '10px' }}
        >
          <option value="all">All</option>
          <option value="canceled">Canceled</option>
          <option value="history">History</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="orders-table">
          <thead>
          <tr>
              <th>Products</th>
              <th>Shipping Details</th>
              <th>Order ID</th>
              <th>User ID</th>
              <th>Status</th>
              
              <th>Quantity</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="order-table-row">
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
                  ) : <div>No shipping details available.</div>}
                </td>
                <td>{order.id}</td>
                <td>{order.userId}</td>
                    <td>{orderStatuses[order.id]}</td>
                
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
                  {!isProfileOrders && (
                    <>
                      <button className="btn-confirm" onClick={() => handleConfirm(order.id)}>Confirm</button>
                      <button className="btn-cancel" onClick={() => handleCancel(order.id)}>Cancel</button>
                    </>
                  )}
                  {isProfileOrders && (
                    <>
                      {/* Remove Cancel button for user profile orders */} 
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Orders;
