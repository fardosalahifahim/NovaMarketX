import React, { createContext, useState, useEffect } from 'react';

export const BannerContext = createContext();

export const BannerProvider = ({ children }) => {
  const [bannerImages, setBannerImages] = useState([]);
  const [bannerText, setBannerText] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/banner');
        if (!response.ok) {
          throw new Error('Failed to fetch banner data');
        }
      const data = await response.json();
      setBannerImages(data || []);
      // Banner text is not provided by backend, keep default or empty
      setBannerText({ title: 'Welcome to PrimeGadgetZone', subtitle: 'Find the best gadgets here!' });
      } catch (error) {
        console.error('Error fetching banner data:', error);
        // Fallback static data
        setBannerImages([
          '/images/banner/anime.jpg',
          '/images/banner/anime2.webp',
          '/images/banner/anime3.jpg',
        ]);
        setBannerText({
          title: 'Welcome to PrimeGadgetZone',
          subtitle: 'Find the best gadgets here!',
        });
      }
    };

    fetchBannerData();
  }, []);

  const updateBanner = async (newBanners) => {
    try {
      const response = await fetch('http://localhost:5000/api/banner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBanners),
      });
      if (!response.ok) {
        throw new Error('Failed to update banner');
      }
      const data = await response.json();
      setBannerImages(data);
      return true;
    } catch (error) {
      console.error('Error updating banner:', error);
      return false;
    }
  };

  return (
    <BannerContext.Provider value={{ bannerImages, setBannerImages, bannerText, setBannerText, updateBanner }}>
      {children}
    </BannerContext.Provider>
  );
};
