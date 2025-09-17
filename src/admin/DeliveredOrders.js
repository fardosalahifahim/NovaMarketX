import React from 'react';

const DeliveredOrders = ({ products, orders, refreshOrders }) => {
  const getProductById = (id) => {
    if (!products || products.length === 0) return null;
    return products.find(product => product.id === id);
  };

  if (!orders) {
    return <p>Loading delivered orders...</p>;
  }

  if (orders.length === 0) {
    return <p>No delivered orders found.</p>;
  }

  return (
    <div>
      <h1>Delivered Orders</h1>
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
                          <div className="product-price">Price: ${product.price.toFixed(2)} <br></br> Total: ${(product.price * productDetail.quantity).toFixed(2)}</div>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveredOrders;
