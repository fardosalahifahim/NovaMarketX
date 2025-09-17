import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import './ProductDetailsPhone.css';
import { CartContext } from '../contexts/CartContext';

const colors = ['#00bfff', '#ff4500', '#ffd700', '#8b4513'];
const sizes = [37, 38, 39, 40, 41, 42];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ProductDetailsPhone = () => {
  const { addToCart } = useContext(CartContext);
  const { productname } = useParams();
  const query = useQuery();
  const id = query.get('id');
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (id) {
      fetchProduct();
    } else {
      setProduct(null);
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      // Always set the first image as default, not videos
      if (product.images && product.images.length > 0) {
        setMainImage(product.images[0]);
      } else if (product.imageUrl) {
        setMainImage(product.imageUrl);
      } else if (product.videos && product.videos.length > 0) {
        // Only use video if no images are available
        const videoUrl = product.videos[0];
        let embedUrl = videoUrl;
        
        if (videoUrl.includes('youtube.com/watch')) {
          const videoId = videoUrl.match(/v=([^&]+)/)?.[1];
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        } else if (videoUrl.includes('youtu.be/')) {
          const videoId = videoUrl.match(/youtu.be\/([^?]+)/)?.[1];
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }
        setMainImage(embedUrl);
      }
    }
  }, [product]);

  const fetchProduct = async () => {
    console.log("Fetching product with ID:", id);
    try {
      const res = await axios.get("http://localhost:5000/api/products/id/" + encodeURIComponent(id));
      console.log("Product data:", res.data);
      setProduct(res.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    }
  };

  const handleAddToCart = () => {
    const user = auth.currentUser;
    if (!user) {
      alert('You are not logged in. Please login to add items to cart.');
      navigate('/login');
      return;
    }
    const cartItem = {
      id: product?.id,
      name: product?.name,
      price: product?.price || 0,
      color: selectedColor,
      size: selectedSize,
      quantity,
      imageUrl: mainImage || product?.imageUrl || ''
    };
    addToCart(cartItem);
    alert('Added to cart!');
  };

  const handleBuyNow = () => {
    const user = auth.currentUser;
    if (!user) {
      alert('You are not logged in. Please login to proceed to checkout.');
      navigate('/login');
      return;
    }
    // Add product to cart first
    const cartItem = {
      id: product?.id,
      name: product?.name,
      price: product?.price || 0,
      color: selectedColor,
      size: selectedSize,
      quantity,
      imageUrl: mainImage || product?.imageUrl || ''
    };
    addToCart(cartItem);
    
    // Then redirect to cart page
    navigate('/cart');
  };

  const nextImage = () => {
    const allImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    setMainImage(allImages[(currentImageIndex + 1) % allImages.length]);
  };

  const prevImage = () => {
    const allImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setMainImage(allImages[(currentImageIndex - 1 + allImages.length) % allImages.length]);
  };

  const getYouTubeThumbnail = (videoUrl) => {
    let videoId = '';
    
    if (videoUrl.includes('youtube.com/watch')) {
      videoId = videoUrl.match(/v=([^&]+)/)?.[1];
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.match(/youtu.be\/([^?]+)/)?.[1];
    } else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.match(/embed\/([^?]+)/)?.[1];
    }
    
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/0.jpg`;
    }
    return '';
  };

  if (!product) return <div className="mobile-loading">Loading...</div>;
  
  const allImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  const videoThumbnails = product.videos ? product.videos.map(video => getYouTubeThumbnail(video)) : [];

  const price = typeof product.price === 'number' ? product.price : 0;

  return (
    <div className="product-details-phone-container">
      {/* Header with back button */}
      <div className="phone-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="phone-title">Product Details</h1>
      </div>

      {/* Image Gallery with Swipe Navigation */}
      <div className="phone-image-gallery">
        <div className="main-image-container-phone">
          {mainImage.includes('youtube.com/embed') ? (
            <iframe
              src={mainImage}
              title="Product Video"
              className="main-product-video-phone"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img 
              src={mainImage.startsWith('http') ? mainImage : `http://localhost:5000/${mainImage}`} 
              alt={product.name} 
              className="main-product-image-phone" 
            />
          )}
          {allImages.length > 1 && (
            <>
              <button className="nav-button prev-button" onClick={prevImage}>‹</button>
              <button className="nav-button next-button" onClick={nextImage}>›</button>
            </>
          )}
        </div>
        
        {/* Image Indicators */}
        {allImages.length > 1 && (
          <div className="image-indicators">
            {allImages.map((_, index) => (
              <div
                key={index}
                className={`indicator ${currentImageIndex === index ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Video Thumbnails */}
        {videoThumbnails.length > 0 && (
          <div className="video-thumbnails-container">
            {videoThumbnails.map((thumbnail, index) => (
              <img 
                key={`video-${index}`} 
                src={thumbnail} 
                alt={`Video ${index + 1}`} 
                className="video-thumbnail"
                onClick={() => {
                  const embedUrl = product.videos[index].includes('youtube.com/watch') 
                    ? `https://www.youtube.com/embed/${product.videos[index].match(/v=([^&]+)/)?.[1]}`
                    : product.videos[index];
                  setMainImage(embedUrl);
                }}
                style={{ cursor: 'pointer', width: '80px', height: '60px', margin: '5px' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="phone-product-info">
        <h2 className="phone-product-name">{product.name || 'No Name'}</h2>
        <p className="phone-product-description">{product.description || 'No Description'}</p>
        <h3 className="phone-product-price">${price.toFixed(2)}</h3>
        
        {/* Color Selection */}
        <div className="phone-product-colors">
          <strong>Color:</strong>
          <div className="phone-color-options">
            {colors.map(color => (
              <div
                key={color}
                onClick={() => setSelectedColor(color)}
                className={"phone-color-circle " + (selectedColor === color ? 'selected' : '')}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Size Selection */}
        <div className="phone-product-sizes">
          <strong>Size:</strong>
          <div className="phone-size-options">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={"phone-size-button " + (selectedSize === size ? 'selected' : '')}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="phone-product-quantity">
          <strong>Quantity:</strong>
          <div className="quantity-controls">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="phone-quantity-input"
            />
            <button onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="phone-action-buttons">
          <button onClick={handleAddToCart} className="phone-add-to-cart-button">
            🛒 Add to Cart
          </button>
          <button onClick={handleBuyNow} className="phone-buy-now-button">
            ⚡ Buy Now
          </button>
        </div>

        {/* Additional Info */}
        <div className="phone-additional-info">
          <div className="info-item">
            <span>🚚 Free Shipping</span>
          </div>
          <div className="info-item">
            <span>↩️ 30-Day Returns</span>
          </div>
          <div className="info-item">
            <span>🔒 Secure Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPhone;
