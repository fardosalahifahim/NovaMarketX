import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = '',
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`lazy-image-placeholder ${className}`}
        {...props}
      >
        <span>📷</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`lazy-image ${isLoaded ? 'loaded' : ''} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default LazyImage;
