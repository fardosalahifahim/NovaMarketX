import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchFavorites(user.uid);
      } else {
        setFavorites([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch favorites from backend
  const fetchFavorites = async (userId) => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else {
        console.error('Failed to fetch favorites');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Add product to favorites
  const addToFavorites = async (product) => {
    if (!currentUser || !product) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return false;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${currentUser.uid}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        const updatedFavorites = await response.json();
        setFavorites(updatedFavorites);
        return true;
      } else {
        console.error('Failed to add to favorites');
        return false;
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  };

  // Remove product from favorites
  const removeFromFavorites = async (productId) => {
    if (!currentUser || !productId) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return false;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${currentUser.uid}/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        setFavorites(result.favorites || []);
        return true;
      } else {
        console.error('Failed to remove from favorites');
        return false;
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  };

  // Check if product is in favorites
  const isFavorite = (productId) => {
    return favorites.some(product => product.id === productId);
  };

  // Toggle favorite status
  const toggleFavorite = async (product) => {
    if (!currentUser) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return false;
    }

    if (isFavorite(product.id)) {
      return await removeFromFavorites(product.id);
    } else {
      return await addToFavorites(product);
    }
  };

  // Require authentication for favorites operations
  const requireAuthForFavorites = () => {
    if (!currentUser) {
      // Redirect to login page
      window.location.href = '/login';
      return false;
    }
    return true;
  };

  const value = {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    fetchFavorites,
    requireAuthForFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
