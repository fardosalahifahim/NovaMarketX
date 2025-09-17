import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../components/BannerManagement.css';
import BannerForm from './BannerForm';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch banners on component mount
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/banner');
      setBanners(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = async (bannerData) => {
    try {
      await axios.post('http://localhost:5000/api/banner', bannerData);
      setShowAddForm(false);
      fetchBanners();
    } catch (err) {
      console.error('Error adding banner:', err);
      alert('Failed to add banner');
    }
  };

  const handleUpdateBanner = async (bannerData) => {
    try {
      await axios.patch(`http://localhost:5000/api/banner/${editingBanner.id}`, bannerData);
      setEditingBanner(null);
      fetchBanners();
    } catch (err) {
      console.error('Error updating banner:', err);
      alert('Failed to update banner. Please check if the backend server is running.');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await axios.delete(`http://localhost:5000/api/banner/${id}`);
        fetchBanners();
      } catch (err) {
        console.error('Error deleting banner:', err);
        alert('Failed to delete banner');
      }
    }
  };

  const handleEditClick = (banner) => {
    setEditingBanner(banner);
    setShowAddForm(true);
  };

  if (loading) {
    return <div className="loading">Loading banners...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="banner-management-container">
      <h1>Banner Management</h1>
      
      <div className="banner-actions">
        <button 
          className="btn-add-banner" 
          onClick={() => {
            setEditingBanner(null);
            setShowAddForm(true);
          }}
        >
          Add New Banner
        </button>
      </div>

      {showAddForm && (
        <BannerForm
          onClose={() => {
            setShowAddForm(false);
            setEditingBanner(null);
          }}
          onSave={editingBanner ? handleUpdateBanner : handleAddBanner}
          initialData={editingBanner}
        />
      )}

      <div className="banners-list">
        <h2>Current Banners ({banners.length})</h2>
        {banners.length === 0 ? (
          <p>No banners found. Add your first banner!</p>
        ) : (
          <div className="banners-grid">
            {banners.map((banner) => (
              <div key={banner.id} className="banner-card">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="banner-preview"
                  onError={(e) => {
                    e.target.src = '/images/banner/default.jpg';
                  }}
                />
                <div className="banner-info">
                  <h3>{banner.title}</h3>
                  <p>{banner.description}</p>
                  <div className="banner-tags">
                    {banner.tags?.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="banner-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEditClick(banner)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteBanner(banner.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManagement;
