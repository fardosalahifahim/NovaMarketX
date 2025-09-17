import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './AISearchResults.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// AI-powered search algorithm
const aiSearchProducts = (products, searchTerm) => {
  if (!searchTerm) return products;
  
  const lowerTerm = searchTerm.toLowerCase();
  const searchWords = lowerTerm.split(/\s+/).filter(word => word.length > 0);
  
  // Score products based on different criteria
  const scoredProducts = products.map(product => {
    let score = 0;
    const productName = product.name?.toLowerCase() || '';
    const productDescription = product.description?.toLowerCase() || '';
    const productTags = product.tags?.map(tag => tag.toLowerCase()) || [];
    
    // Exact name match (highest priority)
    if (productName === lowerTerm) {
      score += 100;
    }
    
    // Name contains search term
    if (productName.includes(lowerTerm)) {
      score += 50;
    }
    
    // Individual word matches in name
    searchWords.forEach(word => {
      if (productName.includes(word)) {
        score += 20;
      }
    });
    
    // Tag matches (medium priority)
    if (productTags.some(tag => tag === lowerTerm)) {
      score += 40;
    }
    
    productTags.forEach(tag => {
      searchWords.forEach(word => {
        if (tag.includes(word)) {
          score += 15;
        }
      });
    });
    
    // Description matches (lowest priority)
    if (productDescription.includes(lowerTerm)) {
      score += 10;
    }
    
    searchWords.forEach(word => {
      if (productDescription.includes(word)) {
        score += 5;
      }
    });
    
    return { ...product, searchScore: score };
  });
  
  // Filter out products with score 0 and sort by score descending
  return scoredProducts
    .filter(product => product.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore);
};

const AISearchResults = () => {
  const query = useQuery();
  const searchTerm = query.get('q') || '';
  const tagsParam = query.get('tags') || '';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchAnalysis, setSearchAnalysis] = useState('');

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
    let analysis = '';
    
    if (tagsParam) {
      // Tag-based search
      const tagList = tagsParam.split(',').map(tag => tag.trim().toLowerCase());
      filtered = products.filter(product => 
        product.tags && product.tags.some(tag => 
          tagList.some(searchTag => tag.toLowerCase().includes(searchTag))
        )
      );
      analysis = `Found ${filtered.length} products matching tags: ${tagList.join(', ')}`;
    } 
    else if (searchTerm) {
      // AI-powered search
      filtered = aiSearchProducts(products, searchTerm);
      
      // Generate analysis text
      const exactMatches = filtered.filter(p => p.searchScore >= 50).length;
      const goodMatches = filtered.filter(p => p.searchScore >= 20 && p.searchScore < 50).length;
      const partialMatches = filtered.filter(p => p.searchScore < 20).length;
      
      analysis = `AI found ${filtered.length} results: ${exactMatches} exact matches, ${goodMatches} good matches, ${partialMatches} partial matches`;
    }

    setFilteredProducts(filtered);
    setSearchAnalysis(analysis);
  }, [products, searchTerm, tagsParam]);

  return (
    <div className="product-list-container">
      {searchTerm ? (
        <div>
          <h2>AI Search Results for "{searchTerm}"</h2>
          {searchAnalysis && <p className="search-analysis">{searchAnalysis}</p>}
        </div>
      ) : tagsParam ? (
        <div>
          <h2 style={{ display: 'none' }}>Looking for products with tags: "{tagsParam}"</h2>
          <p className="search-analysis">{searchAnalysis}</p>
        </div>
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
                {product.searchScore && (
                  <p className="match-score">Match: {product.searchScore}%</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AISearchResults;
