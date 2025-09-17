import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductDetailsModal.css';

const ProductDetailsModal = ({ product, onClose, onUpdate }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    previousPrice: '',
    stock: '',
    maxBuyers: '',
    maxPerPerson: '',
    tier: 'Cheap',
    status: 'Active',
    imageUrl: '',
    images: [],
    videos: [],
    tags: [],
    categories: []
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [videoInput, setVideoInput] = useState('');

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

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        previousPrice: product.previousPrice || '',
        stock: product.stock || '',
        maxBuyers: product.maxBuyers || '',
        maxPerPerson: product.maxPerPerson || '',
        tier: product.tier || 'Cheap',
        status: product.status || 'Active',
        imageUrl: product.imageUrl || '',
        images: Array.isArray(product.images) ? product.images : [],
        videos: Array.isArray(product.videos) ? product.videos : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        categories: Array.isArray(product.categories) ? product.categories : []
      });
    }
  }, [product]);

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

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

  const handleAddCategory = (category) => {
    if (category && !form.categories.includes(category)) {
      setForm(prevForm => ({
        ...prevForm,
        categories: [...prevForm.categories, category]
      }));
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setForm(prevForm => ({
      ...prevForm,
      categories: prevForm.categories.filter(cat => cat !== categoryToRemove)
    }));
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setForm(prevForm => ({ ...prevForm, imageUrl: res.data.imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleMultipleImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setLoading(true);
    try {
      const uploadedImages = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        uploadedImages.push(res.data.imageUrl);
      }
      
      setForm(prevForm => ({
        ...prevForm,
        images: [...prevForm.images, ...uploadedImages]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload some images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setForm(prevForm => ({
      ...prevForm,
      images: prevForm.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.stock) {
      alert('Name, description, price, and stock are required');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/products/${product.id}`, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        previousPrice: form.previousPrice ? parseFloat(form.previousPrice) : null,
        stock: parseInt(form.stock, 10),
        maxBuyers: form.maxBuyers ? parseInt(form.maxBuyers, 10) : null,
        maxPerPerson: form.maxPerPerson ? parseInt(form.maxPerPerson, 10) : null,
        tier: form.tier,
        status: form.status,
        imageUrl: form.imageUrl, // Main image
        images: form.images, // All images in array
        videos: form.videos,
        tags: form.tags,
        categories: form.categories
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Product: {product.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Product ID</label>
                <input
                  type="text"
                  value={product.id}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Previous Price ($)</label>
                <input
                  type="number"
                  name="previousPrice"
                  value={form.previousPrice}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max Buyers</label>
                <input
                  type="number"
                  name="maxBuyers"
                  value={form.maxBuyers}
                  onChange={handleInputChange}
                  placeholder="Leave blank for Unlimited"
                />
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                  {form.stock ? `Only ${form.stock} left in stock` : 'Out of stock'}
                </div>
              </div>
              <div className="form-group">
                <label>Max Per Person</label>
                <input
                  type="number"
                  name="maxPerPerson"
                  value={form.maxPerPerson}
                  onChange={handleInputChange}
                  placeholder="Leave blank for Unlimited"
                />
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                  Max Per Person: {form.maxPerPerson || form.maxPerPerson === 0 ? form.maxPerPerson : 'Unlimited'}
                </div>
              </div>
              <div className="form-group">
                <label>Tier</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Cheap">Cheap</option>
                  <option value="Medium">Medium</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  required
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Images</h3>
            <div className="form-group">
              <label>Main Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Main preview"
                  className="image-preview"
                />
              )}
            </div>
            
            <div className="form-group">
              <label>Additional Images (Multiple)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleImagesChange}
                disabled={loading}
              />
              <div className="images-grid">
                {form.images && form.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image} alt={`Additional ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => handleRemoveImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Videos</h3>
            <div className="form-group">
              <label>Add Video Links (YouTube, Vimeo, etc.)</label>
              <div className="input-with-button">
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVideo();
                    }
                  }}
                />
                <button type="button" onClick={handleAddVideo}>
                  Add Video
                </button>
              </div>
              <div className="videos-list">
                {form.videos && form.videos.map((video, index) => (
                  <div key={index} className="video-item">
                    <span>{video}</span>
                    <button
                      type="button"
                      className="remove-video"
                      onClick={() => handleRemoveVideo(video)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Categories & Tags</h3>
            <div className="form-group">
              <label>Categories</label>
              <div className="input-with-button">
                <input
                  type="text"
                  placeholder="Enter category"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  list="categorySuggestions"
                />
                <datalist id="categorySuggestions">
                  {categoriesOptions.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => handleAddCategory(categoryInput)}
                >
                  Add Category
                </button>
              </div>
              <div className="categories-list">
                {form.categories && form.categories.map((cat, index) => (
                  <span key={index} className="category-tag">
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="input-with-button">
                <input
                  type="text"
                  placeholder="Enter tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button type="button" onClick={handleAddTag}>
                  Add Tag
                </button>
              </div>
              <div className="tags-list">
                {form.tags && form.tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="save-button"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
