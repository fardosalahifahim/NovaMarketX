// Utility function to truncate text to a specified length
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

// Utility function to truncate product description specifically for home page
export const truncateProductDescription = (description, maxLength = 80) => {
  return truncateText(description, maxLength);
};

// Utility function to truncate product name specifically for home page
export const truncateProductName = (name, maxLength = 40) => {
  return truncateText(name, maxLength);
};
