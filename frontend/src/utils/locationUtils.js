// Location utility functions for location-based recommendations

/**
 * Request location permission from the user
 * @returns {Promise<string|null>} Promise that resolves to the location or null if denied
 */
export const requestLocationPermission = async () => {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser');
    return null;
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });
    });

    // Convert coordinates to a location string (city/area)
    const { latitude, longitude } = position.coords;
    
    // For now, we'll use a simple location string based on coordinates
    // In a real implementation, you would use a reverse geocoding API
    const location = await reverseGeocode(latitude, longitude);
    
    // Store location in localStorage for future use
    localStorage.setItem('userLocation', location);
    localStorage.setItem('locationPermission', 'granted');
    
    return location;
  } catch (error) {
    console.warn('Location permission denied or error:', error);
    localStorage.setItem('locationPermission', 'denied');
    return null;
  }
};

/**
 * Simple reverse geocoding function (mock implementation)
 * In a real app, you would use a service like Google Maps Geocoding API
 * This implementation doesn't expose exact coordinates for privacy
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Location string
 */
const reverseGeocode = async (latitude, longitude) => {
  // Mock implementation - in a real app, you would call a geocoding API
  // For now, we'll return a location based on approximate coordinates
  // This doesn't expose the actual coordinates to protect user privacy
  
  // Major city areas - using descriptive names only
  if (latitude > 40 && latitude < 42 && longitude > -74 && longitude < -72) {
    return 'New York';
  } else if (latitude > 33 && latitude < 35 && longitude > -119 && longitude < -117) {
    return 'Los Angeles';
  } else if (latitude > 51 && latitude < 52 && longitude > -0.5 && longitude < 0.5) {
    return 'London';
  } else if (latitude > 35 && latitude < 37 && longitude > 139 && longitude < 141) {
    return 'Tokyo';
  } else if (latitude > 48 && latitude < 50 && longitude > 2 && longitude < 4) {
    return 'Paris';
  } else if (latitude > 52 && latitude < 53 && longitude > 13 && longitude < 14) {
    return 'Berlin';
  }
  
  // Bangladesh regions - using city names only
  else if (latitude > 23 && latitude < 25 && longitude > 90 && longitude < 92) {
    return 'Dhaka';
  } else if (latitude > 22 && latitude < 24 && longitude > 89 && longitude < 91) {
    return 'Faridpur';
  } else if (latitude > 24 && latitude < 26 && longitude > 88 && longitude < 90) {
    return 'Rajshahi';
  } else if (latitude > 22 && latitude < 24 && longitude > 91 && longitude < 93) {
    return 'Chittagong';
  } else if (latitude > 23 && latitude < 25 && longitude > 89 && longitude < 91) {
    return 'Mymensingh';
  } else if (latitude > 23 && latitude < 25 && longitude > 88 && longitude < 90) {
    return 'Rangpur';
  } else if (latitude > 22 && latitude < 24 && longitude > 90 && longitude < 92) {
    return 'Barisal';
  } else if (latitude > 22 && latitude < 24 && longitude > 89 && longitude < 91) {
    return 'Khulna';
  } else if (latitude > 23 && latitude < 25 && longitude > 90 && longitude < 92) {
    return 'Sylhet';
  }
  
  // General regions based on coordinates without exposing any numbers
  else if (latitude > 0 && longitude > 0) {
    return 'Eastern Region';
  } else if (latitude > 0 && longitude < 0) {
    return 'Western Region';
  } else if (latitude < 0 && longitude > 0) {
    return 'Southern Region';
  } else if (latitude < 0 && longitude < 0) {
    return 'Northern Region';
  } else {
    // Default to a generic location that doesn't expose coordinates
    return 'Local Area';
  }
};

/**
 * Get user's location from localStorage or request permission
 * @returns {Promise<string|null>} Location string or null
 */
export const getUserLocation = async () => {
  const permission = localStorage.getItem('locationPermission');
  
  if (permission === 'denied') {
    return null;
  }
  
  const savedLocation = localStorage.getItem('userLocation');
  if (savedLocation) {
    return savedLocation;
  }
  
  // No saved location, request permission
  return await requestLocationPermission();
};

/**
 * Check if location permission has been granted
 * @returns {boolean} True if permission granted
 */
export const hasLocationPermission = () => {
  return localStorage.getItem('locationPermission') === 'granted';
};

/**
 * Reset location permission (for testing)
 */
export const resetLocationPermission = () => {
  localStorage.removeItem('locationPermission');
  localStorage.removeItem('userLocation');
};

/**
 * Fetch location-based product recommendations
 * @param {string} location 
 * @returns {Promise<Array>} Array of recommended products
 */
export const fetchLocationBasedProducts = async (location) => {
  try {
    const response = await fetch(`http://localhost:5000/api/products/location/${encodeURIComponent(location)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch location-based products');
    }
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching location-based products:', error);
    // Fallback to popular products
    return fetchPopularProducts();
  }
};

/**
 * Fetch popular products (fallback)
 * @returns {Promise<Array>} Array of popular products
 */
export const fetchPopularProducts = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/products/popular');
    if (!response.ok) {
      throw new Error('Failed to fetch popular products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular products:', error);
    return [];
  }
};

/**
 * Show location permission dialog if not already shown or if it's time to ask again
 * @returns {Promise<string|null>} Location or null
 */
export const showLocationPermissionDialog = async () => {
  const lastAsked = localStorage.getItem('locationPermissionLastAsked');
  const permissionShown = localStorage.getItem('locationPermissionShown');
  const permission = localStorage.getItem('locationPermission');
  
  // Check if we should ask again (after 1 day)
  const shouldAskAgain = () => {
    if (!lastAsked) return true;
    const lastAskedDate = new Date(parseInt(lastAsked));
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return lastAskedDate < oneDayAgo;
  };
  
  // If permission was previously denied and it's been less than 1 day, don't ask again
  if (permission === 'denied' && !shouldAskAgain()) {
    return null;
  }
  
  // If permission was previously shown but not denied, or it's time to ask again
  if (permissionShown && permission !== 'denied' && !shouldAskAgain()) {
    return getUserLocation();
  }
  
  // Show a custom dialog asking for location permission
  const userConfirmed = window.confirm(
    'PrimeGadgetZone would like to use your location to show personalized product recommendations. Allow location access?'
  );
  
  localStorage.setItem('locationPermissionShown', 'true');
  localStorage.setItem('locationPermissionLastAsked', Date.now().toString());
  
  if (userConfirmed) {
    return await requestLocationPermission();
  } else {
    localStorage.setItem('locationPermission', 'denied');
    return null;
  }
};
