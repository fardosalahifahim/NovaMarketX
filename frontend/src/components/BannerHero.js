import React, { useState, useEffect } from 'react';
import './BannerHero.css';

const BannerHero = ({ bannerImages, bannerText }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState('right');

  useEffect(() => {
    if (!bannerImages || bannerImages.length === 0) {
      return;
    }
    const interval = setInterval(() => {
      setTransitionDirection('right');
      setCurrentIndex(prevIndex => (prevIndex + 1) % bannerImages.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [bannerImages]);

  if (!bannerImages || bannerImages.length === 0) {
    return <div className="banner-hero-placeholder">No banner images available</div>;
  }

  // Ensure image URL is absolute or prepend host if relative
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Prepend host for relative URLs
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <section
      className="banner-hero"
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Decorative corner elements */}
      <div className="corner-decoration corner-top-left"></div>
      <div className="corner-decoration corner-top-right"></div>
      <div className="corner-decoration corner-bottom-left"></div>
      <div className="corner-decoration corner-bottom-right"></div>
      
      {/* Decorative lines */}
      <div className="decorative-line decorative-line-top"></div>
      <div className="decorative-line decorative-line-bottom"></div>
      <div className="decorative-line decorative-line-left"></div>
      <div className="decorative-line decorative-line-right"></div>
      
      <div className="banner-slider-container">
        {bannerImages.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`banner-slide ${index === currentIndex ? 'active' : ''} ${transitionDirection}`}
          >
            <img
              src={getImageUrl(banner.imageUrl)}
              alt={`Banner ${index + 1}`}
              style={{ width: '100%', height: '100%', borderRadius: '25px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/banner/default.jpg'; // fallback image
              }}
            />
          </div>
        ))}
      </div>
      <div className="banner-text-overlay">
        <h1>{bannerImages[currentIndex]?.title}</h1>
        <p>{bannerImages[currentIndex]?.description}</p>
        {bannerImages[currentIndex]?.buttonText && (
          <button
            onClick={() => {
              const tags = bannerImages[currentIndex]?.tags || [];
              const query = tags.join(',');
              window.location.href = `/search?tags=${encodeURIComponent(query)}`;
            }}
          >
            {bannerImages[currentIndex].buttonText}
          </button>
        )}
      </div>
      <div className="banner-navigation">
        {bannerImages.map((_, index) => {
          let dotClass = 'banner-dot';
          
          // Calculate the distance from current index
          const distance = Math.abs(index - currentIndex);
          
          if (index === currentIndex) {
            dotClass += ' active'; // Large dot for active
          } else if (distance === 1 || distance === 2) {
            dotClass += ' medium'; // Medium dots for the next two
          } else if (distance === 3 || distance === 4) {
            dotClass += ' small'; // Small dots for the next two
          } else {
            dotClass += ' hidden'; // Hide any dots beyond the first five
          }

          return (
            <div
              key={index}
              className={dotClass}
              onClick={() => {
                setTransitionDirection(index > currentIndex ? 'right' : 'left');
                setCurrentIndex(index);
              }}
            />
          );
        })}
      </div>
    </section>
  );
};

export default BannerHero;
