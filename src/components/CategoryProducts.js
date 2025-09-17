import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const CategoryProducts = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await res.json();
        // Filter products by categoryName (case insensitive)
        const filtered = data.filter(product =>
          product.categories && product.categories.some(cat => cat.toLowerCase() === categoryName.toLowerCase())
        );
        setProducts(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryName]);

  if (loading) return <p>Loading products for category "{categoryName}"...</p>;
  if (error) return <p>Error: {error}</p>;
  if (products.length === 0) return <p>No products found in category "{categoryName}".</p>;

  return (
    <div className="product-list-container">
      <h2>Products in category: {categoryName}</h2>
      <div className="product-list-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.imageUrl} alt={product.name} className="product-image" />
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryProducts;
