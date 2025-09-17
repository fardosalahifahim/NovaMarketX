import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import './ProductDetails.css';
import { CartContext } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNotification } from '../contexts/NotificationContext';

const colors = ['#00bfff', '#ff4500', '#ffd700', '#8b4513'];
const sizes = [37, 38, 39, 40, 41, 42];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ProductDetails = () => {
  const { addToCart } = useContext(CartContext);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { showNotification } = useNotification();
  const { productname } = useParams();
  const query = useQuery();
  const id = query.get('id');
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [lastStockUpdate, setLastStockUpdate] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (id) {
      fetchProduct();
    } else {
      setProduct(null);
    }
  }, [id]);

  // Function to fetch current product data for real-time updates
  const fetchCurrentProductData = async () => {
    if (!id) return;

    try {
      const res = await axios.get("http://localhost:5000/api/products/id/" + encodeURIComponent(id));
      setProduct(prevProduct => {
        // Only update if there are changes to avoid unnecessary re-renders
        if (JSON.stringify(prevProduct) !== JSON.stringify(res.data)) {
          console.log('Updated product with real-time stock data');
          return res.data;
        }
        return prevProduct;
      });
      setLastStockUpdate(new Date().toISOString());
    } catch (error) {
      console.error("Error fetching current product data:", error);
    }
  };

  // Update product data periodically (every 30 seconds)
  useEffect(() => {
    if (!product) return;

    // Initial stock update
    fetchCurrentProductData();

    // Set up periodic updates
    const intervalId = setInterval(fetchCurrentProductData, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [product?.id]); // Only re-run when product ID changes

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

  // Function to get YouTube thumbnail from URL
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

  // Function to convert video URL to embed URL
  const convertToEmbedUrl = (videoUrl) => {
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
    
    return embedUrl;
  };

  if (!product) return <div>Loading...</div>;

  const price = typeof product.price === 'number' ? product.price : 0;
  const allImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

  return (
    <div className="product-details-container">
      <div className="product-details-content">
        <div className="product-image-section">
          <div className="main-image-container">
            {mainImage.includes('youtube.com/embed') ? (
              <iframe
                src={mainImage}
                title="Product Video"
                className="main-product-video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img 
                src={mainImage.startsWith('http') ? mainImage : `http://localhost:5000/${mainImage}`} 
                alt={product.name} 
                className="main-product-image" 
              />
            )}
          </div>
          
          <div className="thumbnail-container">
            {/* Image thumbnails */}
            {allImages.map((image, index) => (
              <img 
                key={`image-${index}`} 
                src={image.startsWith('http') ? image : `http://localhost:5000/${image}`} 
                alt={`${product.name} ${index + 1}`} 
                className={`thumbnail ${mainImage === image ? 'active' : ''}`}
                onClick={() => {
                  setMainImage(image);
                }}
              />
            ))}
            
            {/* Video thumbnails */}
            {product.videos && product.videos.map((video, index) => {
              const embedUrl = convertToEmbedUrl(video);
              const thumbnailUrl = getYouTubeThumbnail(video);
              
              return (
                <img 
                  key={`video-${index}`} 
                  src={thumbnailUrl} 
                  alt={`Video ${index + 1}`} 
                  className={`thumbnail video-thumbnail ${mainImage === embedUrl ? 'active' : ''}`}
                  onClick={() => {
                    setMainImage(embedUrl);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </div>
        </div>

        <div className="product-info">
          <h2 className="product-name">{product.name || 'No Name'}</h2>
          <p className="product-description">{product.description || 'No Description'}</p>
          <h3 className="product-price">${price.toFixed(2)}</h3>
          
          <div className="product-colors">
            <strong>Color:</strong>
            <div className="color-options">
              {colors.map(color => (
                <div
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={"color-circle " + (selectedColor === color ? 'selected' : '')}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="product-sizes">
            <strong>Size:</strong>
            <div className="size-options">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={"size-button " + (selectedSize === size ? 'selected' : '')}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div className="product-quantity">
            <strong>Quantity:</strong>
            <input
              type="number"
              min="1"
              max={product?.stock || undefined}
              value={quantity}
              onChange={e => {
                const value = parseInt(e.target.value) || 1;
                const maxStock = product?.stock || Infinity;
                setQuantity(Math.min(value, maxStock));
              }}
              className="quantity-input"
            />
            {product?.stock && product.stock > 0 && (
              <div className="stock-info">
                <span className="stock-available">Only {product.stock} left in stock</span>
              </div>
            )}
            {product?.stock === 0 && (
              <div className="stock-info">
                <span className="out-of-stock">Out of stock</span>
              </div>
            )}
            {product?.maxPerPerson && (
              <div className="stock-info">
                <span className="max-per-person">Max per person: {product.maxPerPerson}</span>
              </div>
            )}
          </div>
          <div className="button-container">
            <button
              onClick={handleAddToCart}
              className="add-to-cart-button"
              disabled={product?.stock === 0}
            >
              {product?.stock === 0 ? 'Out of Stock' : 'Add to cart'}
            </button>
            <button
              onClick={handleBuyNow}
              className="buy-now-button"
              disabled={product?.stock === 0}
            >
              {product?.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
            <button
              className={`favorite-btn ${isFavorite(product?.id) ? 'favorited' : ''}`}
              onClick={() => {
                if (isFavorite(product?.id)) {
                  removeFromFavorites(product?.id);
                  showNotification(`${product?.name} removed from favorites`, 'info');
                } else {
                  const success = addToFavorites(product);
                  if (success) {
                    showNotification(`${product?.name} added to favorites`, 'success');
                  }
                }
              }}
              title={isFavorite(product?.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className="favorite-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          <div className="back-to-shop">
            <Link to="/">Back to Shop</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
