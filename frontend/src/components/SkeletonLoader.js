import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'product-card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'product-card':
        return (
          <div className="skeleton-product-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-description"></div>
              <div className="skeleton-price"></div>
              <div className="skeleton-buttons">
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
              </div>
            </div>
          </div>
        );
      case 'text':
        return <div className="skeleton-text"></div>;
      case 'image':
        return <div className="skeleton-image"></div>;
      default:
        return <div className="skeleton-default"></div>;
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className={`skeleton-container skeleton-${type}-container`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
