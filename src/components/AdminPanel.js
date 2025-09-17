import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

import AdminNavBar from './AdminNavBar';
import AdminMessages from './AdminMessages';
import Orders from './Orders';
import MyOrders from './myorders';
import OrderHistory from './OrderHistory';
import CancelOrders from './CancelOrders';
import DeliveredOrders from './DeliveredOrders';
import ConfirmedOrders from './ConfirmedOrders';
import AdminConfirmedOrders from './AdminConfirmedOrders';
import AdminShippedOrders from './AdminShippedOrders';
import Dashboard from './Dashboard';
import BannerManagement from './BannerManagement';
import ProductDetailsModal from './ProductDetailsModal';

import { BannerContext } from '../contexts/BannerContext';
import BannerForm from './BannerForm';

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('products');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    status: 'Active',
    imageUrls: [],
    videos: [],
    tags: [],
    categories: []
  });

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  const [productId, setProductId] = useState('');
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);

  const categoriesOptions = [
    'Fashion',
    'Electronics',
    'Home & Garden',
    'Books',
    'Sports & Outdoors',
    'Health & Beauty',
    'Food & Grocery',
    'Toys & Games',
    'Automotive'
  ].filter(Boolean);

  const statusOptions = ['Active', 'Draft', 'Scheduled'];

  const [categoryInput, setCategoryInput] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const handleCategoryInputChange = (e) => {
    const value = e.target.value;
    setCategoryInput(value);
    if (value.length > 0) {
      const filtered = categoriesOptions.filter(cat =>
        cat.toLowerCase().includes(value.toLowerCase()) &&
        !form.categories.includes(cat)
      );
      setCategorySuggestions(filtered);
      setShowCategorySuggestions(true);
    } else {
      setShowCategorySuggestions(false);
    }
  };

  const handleCategorySuggestionClick = (category) => {
    handleAddCategory(category);
  };

  // Function to generate unique 6-digit product ID
  const generateUniqueProductId = () => {
    let newId;
    const existingIds = new Set(products && products.length > 0 ? products.map(p => p.id) : []);
    do {
      newId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (existingIds.has(newId));
    return newId;
  };

  // Generate product ID when form is shown
  useEffect(() => {
    if (showAddProductForm) {
      const newId = generateUniqueProductId();
      setProductId(newId);
    }
  }, [showAddProductForm]);

  // Handler to regenerate product ID
  const handleRegenerateId = () => {
    const newId = generateUniqueProductId();
    setProductId(newId);
  };

  const handleAddCategory = (category) => {
    if (category && !form.categories.includes(category)) {
      setForm(prevForm => ({
        ...prevForm,
        categories: [...prevForm.categories, category]
      }));
      setCategoryInput('');
      setShowCategorySuggestions(false);
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setForm(prevForm => ({
      ...prevForm,
      categories: prevForm.categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  const [tagInput, setTagInput] = useState('');
  const [videoInput, setVideoInput] = useState('');

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !form.tags.includes(newTag)) {
      setForm(prevForm => ({
        ...prevForm,
        tags: [...prevForm.tags, newTag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm(prevForm => ({
      ...prevForm,
      tags: prevForm.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddVideo = () => {
    const newVideo = videoInput.trim();
    if (newVideo && !form.videos.includes(newVideo)) {
      setForm(prevForm => ({
        ...prevForm,
        videos: [...prevForm.videos, newVideo]
      }));
      setVideoInput('');
    }
  };

  const handleRemoveVideo = (videoToRemove) => {
    setForm(prevForm => ({
      ...prevForm,
      videos: prevForm.videos.filter(video => video !== videoToRemove)
    }));
  };

  const [stockInput, setStockInput] = useState('');
  const [statusInput, setStatusInput] = useState('Active');

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage
    const storedAuth = localStorage.getItem('adminIsAuthenticated');
    return storedAuth === 'true';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('adminIsAuthenticated', 'true');
      fetchProducts();
      fetchUsers();
      fetchMessages();
      fetchOrders();
    } else {
      localStorage.removeItem('adminIsAuthenticated');
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      console.log('Fetched products:', res.data);
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      console.log('Fetched users:', res.data);
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/messages');
      console.log('Fetched messages:', res.data);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const [orders, setOrders] = useState([]);
  const [processingOrders, setProcessingOrders] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [canceledOrders, setCanceledOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      console.log('Fetched orders:', res.data);
      setOrders(res.data);
      // Separate orders by status
      const processing = res.data.filter(order => order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing');
      const confirmed = res.data.filter(order => order.status.toLowerCase() === 'confirmed');
      const canceled = res.data.filter(order => order.status.toLowerCase() === 'canceled');
      const history = res.data.filter(order => ['returned', 'cancelled', 'cancel'].includes(order.status.toLowerCase()));
      const shipped = res.data.filter(order => order.status.toLowerCase() === 'shipping' || order.status.toLowerCase() === 'shipped');
      const delivered = res.data.filter(order => order.status.toLowerCase() === 'delivered');
      setProcessingOrders(processing);
      setConfirmedOrders(confirmed);
      setCanceledOrders(canceled);
      setOrderHistory(history);
      setShippedOrders(shipped);
      setDeliveredOrders(delivered);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fix: fetch products after adding a product to update product list with new productId
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleStockChange = (e) => {
    setStockInput(e.target.value);
    setForm(prevForm => ({
      ...prevForm,
      stock: e.target.value
    }));
  };

  const handleStatusChange = (e) => {
    setStatusInput(e.target.value);
    setForm(prevForm => ({
      ...prevForm,
      status: e.target.value
    }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const uploadedUrls = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        uploadedUrls.push(res.data.imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload image: ${file.name}. Please try again.`);
      }
    }
    
    if (uploadedUrls.length > 0) {
      setForm(prevForm => ({ 
        ...prevForm, 
        imageUrls: [...prevForm.imageUrls, ...uploadedUrls] 
      }));
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setForm(prevForm => ({
      ...prevForm,
      imageUrls: prevForm.imageUrls.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.stock) {
      alert('Name, description, price, and stock are required');
      return;
    }
    try {
      // Use the first image as the main/default image, and all images in the images array
      const mainImageUrl = form.imageUrls && form.imageUrls.length > 0 ? form.imageUrls[0] : '';
      
      await axios.post('http://localhost:5000/api/products', {
        id: productId,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        status: form.status,
        imageUrl: mainImageUrl, // First image as main/default
        images: form.imageUrls, // All images in array
        videos: form.videos,
        tags: form.tags,
        categories: form.categories
      });
      setForm({
        name: '',
        description: '',
        price: '',
        stock: '',
        status: 'Active',
        imageUrls: [],
        tags: [],
        categories: []
      });
      setProductId('');
      setStockInput('');
      setStatusInput('Active');
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      alert('Failed to add product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleShowProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetailsModal(true);
  };

  const handleCloseProductDetails = () => {
    setSelectedProduct(null);
    setShowProductDetailsModal(false);
  };

  const handleProductUpdate = () => {
    fetchProducts(); // Refresh the product list after update
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginInputChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const { username, password } = loginForm;
    if (username === 'Anime-spring' && password === 'gHost-oF-the-maRket') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminIsAuthenticated');
    setLoginForm({ username: '', password: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <h2>Admin Panel Login</h2>
        <form onSubmit={handleLoginSubmit} className="admin-login-form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={loginForm.username}
            onChange={handleLoginInputChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={handleLoginInputChange}
            required
          />
          {loginError && <p className="login-error">{loginError}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel-container admin-panel-layout">
      <AdminNavBar activeSection={activeSection} onSectionChange={handleSectionChange} onLogout={handleLogout} />
      <main className="main-content">
        {activeSection === 'dashboard' && (
          <Dashboard products={products} />
        )}
        {activeSection === 'products' && (
          <>
            <h1 id="products">Products</h1>
            <div className="product-list-header">
              <h2>Products list</h2>
              <div className="product-list-actions">
                <button className="btn-filter">Filter</button>
                <button className="btn-see-all">See All</button>
                <button className="btn-add" onClick={() => setShowAddProductForm(!showAddProductForm)}>+ Add Product</button>
              </div>
            </div>
            {showAddProductForm && (
              <form onSubmit={handleAddProduct} className="admin-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="productId"
                  placeholder="Product ID"
                  value={productId || ''}
                  disabled
                  readOnly
                  style={{ backgroundColor: '#e0e0e0', cursor: 'not-allowed' }}
                />
                <button type="button" onClick={handleRegenerateId} style={{ marginBottom: '10px' }}>
                  Regenerate ID
                </button>
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={form.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
                <input
                  type="number"
                  name="stock"
                  placeholder="Stock"
                  value={stockInput}
                  onChange={handleStockChange}
                  required
                />
                <select
                  name="status"
                  value={statusInput}
                  onChange={handleStatusChange}
                  required
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <input
                  type="file"
                  name="imageFiles"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />
                <div className="image-previews">
                {form.imageUrls && form.imageUrls.map((url, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={url} alt={`Preview ${index + 1}`} className="image-preview" />
                    <button 
                      type="button" 
                      className="remove-image-button" 
                      onClick={() => handleRemoveImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                </div>
                <div className="category-input-container">
                  <input
                    type="text"
                    placeholder="Enter category"
                    value={categoryInput}
                    onChange={handleCategoryInputChange}
                    onFocus={() => setShowCategorySuggestions(categoryInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory(categoryInput);
                      }
                    }}
                  />
                  <button type="button" onClick={() => handleAddCategory(categoryInput)}>+ Add Category</button>
                  {showCategorySuggestions && categorySuggestions.length > 0 && (
                    <div className="category-suggestions">
                      {categorySuggestions.map((cat, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onClick={() => handleCategorySuggestionClick(cat)}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="categories-list">
                  {form.categories && form.categories.map((cat, index) => (
                    <span key={index} className="category-item">
                      {cat}
                      <button type="button" className="remove-category-button" onClick={() => handleRemoveCategory(cat)}>x</button>
                    </span>
                  ))}
                </div>
                <div className="tags-input-container">
                  <input
                    type="text"
                    name="tagInput"
                    placeholder="Enter tag"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddTag}>+ Add Tag</button>
                </div>
                <div className="tags-list">
                  {form.tags && form.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                      <button type="button" className="remove-tag-button" onClick={() => handleRemoveTag(tag)}>x</button>
                    </span>
                  ))}
                </div>
                <div className="video-input-container">
                  <input
                    type="text"
                    placeholder="Enter video URL"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVideo();
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddVideo}>+ Add Video</button>
                </div>
                <div className="videos-list">
                  {form.videos && form.videos.map((video, index) => (
                    <div key={index} className="video-item">
                      <span>{video}</span>
                      <button type="button" className="remove-video-button" onClick={() => handleRemoveVideo(video)}>x</button>
                    </div>
                  ))}
                </div>
                <button type="submit">Add Product</button>
              </form>
            )}
            <table className="product-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Product Name</th>
                  <th>Product ID</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products && products.map(product => (
                  <tr key={product.id} className="product-table-row">
                    <td><input type="checkbox" /></td>
                    <td className="product-name-cell">
                      {console.log('Product imageUrl:', product.imageUrl)}
                      <img src={product.imageUrl && product.imageUrl.startsWith('http') ? product.imageUrl : `${window.location.origin}/uploads/${product.imageUrl}`} alt={product.name} className="product-table-image" />
                      <span>{product.name}</span>
                    </td>
                    <td>{product.id}</td>
                    <td>{(product.categories && product.categories.length > 0) ? product.categories.join(', ') : 'No Category'}</td>
                    <td>${product.price ? product.price.toFixed(2) : '0.00'}</td>
                    <td>{product.stock || 0}</td>
                    <td>
                      <span className={`status-badge status-${(product.status || '').toLowerCase()}`}>
                        {product.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-details" onClick={() => handleShowProductDetails(product)}>Details</button>
                      <button className="btn-delete" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeSection === 'users' && (
          <>
            <h1 id="users">User Data</h1>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Password</th>
                  <th>Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.map(user => (
                  <tr key={user.id} className="user-table-row">
                    <td>{user.username || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.password || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeSection === 'messages' && (
          <AdminMessages />
        )}
        {activeSection === 'orders' && (
          <Orders orders={processingOrders} products={products} onOrderStatusChange={fetchOrders} />
        )}
        {activeSection === 'cancelorder' && (
          <CancelOrders orders={canceledOrders} products={products} />
        )}
        {activeSection === 'confirmedOrders' && (
          <AdminConfirmedOrders products={products} />
        )}
      {activeSection === 'orderhistory' && (
          <OrderHistory />
        )}
      {activeSection === 'deliveredorders' && (
          <DeliveredOrders products={products} orders={deliveredOrders} refreshOrders={fetchOrders} />
        )}
      {activeSection === 'shippedOrders' && (
          <AdminShippedOrders products={products} onOrderStatusChange={fetchOrders} />
        )}
      {activeSection === 'update' && (
          <BannerManagement />
        )}
      </main>
      
      {showProductDetailsModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={handleCloseProductDetails}
          onUpdate={handleProductUpdate}
        />
      )}
    </div>
  );
};

export default AdminPanel;
