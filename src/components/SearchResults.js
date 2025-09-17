import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
  const query = useQuery();
  const searchTerm = query.get('q') || '';
  const tagsParam = query.get('tags') || '';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

    useEffect(() => {
    let filtered = products;
    
    // If tags parameter is provided, search by tags
    if (tagsParam) {
      const tagList = tagsParam.split(',').map(tag => tag.trim().toLowerCase());
      filtered = products.filter(product => 
        product.tags && product.tags.some(tag => 
          tagList.some(searchTag => tag.toLowerCase().includes(searchTag))
        )
      );
    } 
    // If search term is provided, search by name, tags, or description with priority
    else if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      
      // Create a scored array with priority: name > tags > description
      const scoredProducts = products.map(product => {
        let score = 0;
        
        // Name match - highest priority (score 3)
        const nameMatch = product.name.toLowerCase().includes(lowerTerm);
        if (nameMatch) score += 3;
        
        // Tag match - medium priority (score 2)
        const tagMatch = product.tags && product.tags.some(tag => tag.toLowerCase().includes(lowerTerm));
        if (tagMatch) score += 2;
        
        // Description match - lowest priority (score 1)
        const descMatch = product.description && product.description.toLowerCase().includes(lowerTerm);
        if (descMatch) score += 1;
        
        return { product, score };
      });
      
      // Filter out products with no matches and sort by score (highest first)
      filtered = scoredProducts
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, tagsParam]);

  return (
    <div className="product-list-container">
      {searchTerm ? (
        <h2>Search Results for "{searchTerm}"</h2>
      ) : tagsParam ? (
        <h2 style={{ display: 'none' }}>Looking for products with tags: "{tagsParam}"</h2>
      ) : (
        <h2>All Products</h2>
      )}
      {filteredProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul className="product-list-grid">
          {filteredProducts.map(product => (
            <li key={product.id} className="product-card">
              <Link to={`/product/${encodeURIComponent(product.name)}?id=${product.id}`}>
                <img src={product.imageUrl} alt={product.name} className="product-image" />
                <h3>{product.name}</h3>
                <p className="price">${product.price.toFixed(2)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchResults;
