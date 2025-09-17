const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const cache = require('../cache');

const productsFilePath = path.join(__dirname, '../products.json');

let products = [];

// Load products from file if exists
if (fs.existsSync(productsFilePath)) {
  try {
    const data = fs.readFileSync(productsFilePath, 'utf-8');
    products = JSON.parse(data);
    // Convert all product ids to strings for consistency
    products = products.map(p => ({
      ...p,
      id: String(p.id),
      images: p.images || [],
      videos: p.videos || []
    }));
  } catch (err) {
    console.error('Error reading products file:', err);
    products = [];
  }
} else {
  products = [];
}

// Helper function to save products to file
function saveProductsToFile() {
  fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
    if (err) {
      console.error('Error saving products file:', err);
    }
  });
}

// Get all products with caching
router.get('/', (req, res) => {
  const cacheKey = 'products:all';
  const cachedProducts = cache.get(cacheKey);

  if (cachedProducts) {
    return res.json(cachedProducts);
  }

  const productsWithCreatedAt = products.map(product => ({
    ...product,
    createdAt: product.createdAt || new Date('2024-01-01T00:00:00.000Z').toISOString()
  }));

  // Cache for 5 minutes
  cache.set(cacheKey, productsWithCreatedAt, 5 * 60 * 1000);
  res.json(productsWithCreatedAt);
});

// Add pagination (skip & limit) to /api/products endpoint
router.get('/paginated', (req, res) => {
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const paginatedProducts = products.slice(skip, skip + limit);
  res.json({
    products: paginatedProducts,
    total: products.length,
    skip,
    limit
  });
});

// Get product by id
router.get('/id/:id', (req, res) => {
  const id = req.params.id;
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Add a new product
router.post('/', (req, res) => {
  const { id, name, description, price, stock, status, imageUrl, images, videos, tags, categories, maxBuyers, maxPerPerson, previousPrice, tier } = req.body;
  if (!id || !name || !description || !price || stock === undefined || !status) {
    return res.status(400).json({ error: 'ID, name, description, price, stock and status are required' });
  }
  const newProduct = {
    id: id,
    name,
    description,
    price: parseFloat(price),
    stock: parseInt(stock, 10),
    status,
    imageUrl: imageUrl || 'https://via.placeholder.com/150',
    images: Array.isArray(images) ? images : [],
    videos: Array.isArray(videos) ? videos : [],
    tags: Array.isArray(tags) ? tags : [],
    categories: Array.isArray(categories) ? categories : [],
    maxBuyers: maxBuyers ? parseInt(maxBuyers, 10) : null,
    maxPerPerson: maxPerPerson ? parseInt(maxPerPerson, 10) : null,
    previousPrice: previousPrice ? parseFloat(previousPrice) : null,
    tier: tier || null
  };
  products.push(newProduct);
  saveProductsToFile();

  // Invalidate cache
  cache.delete('products:all');

  res.status(201).json(newProduct);
});

// Update a product by id
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, description, price, stock, status, imageUrl, images, videos, tags, categories, maxBuyers, maxPerPerson, previousPrice, tier } = req.body;
  if (!name || !description || price === undefined || stock === undefined || !status) {
    return res.status(400).json({ error: 'Name, description, price, stock and status are required' });
  }

  const updatedProduct = {
    ...products[index],
    name,
    description,
    price: parseFloat(price),
    stock: parseInt(stock, 10),
    status,
    imageUrl: imageUrl || products[index].imageUrl,
    images: Array.isArray(images) ? images : products[index].images || [],
    videos: Array.isArray(videos) ? videos : products[index].videos || [],
    tags: Array.isArray(tags) ? tags : products[index].tags || [],
    categories: Array.isArray(categories) ? categories : products[index].categories || [],
    maxBuyers: maxBuyers !== undefined ? (maxBuyers ? parseInt(maxBuyers, 10) : null) : products[index].maxBuyers,
    maxPerPerson: maxPerPerson !== undefined ? (maxPerPerson ? parseInt(maxPerPerson, 10) : null) : products[index].maxPerPerson,
    previousPrice: previousPrice !== undefined ? (previousPrice ? parseFloat(previousPrice) : null) : products[index].previousPrice,
    tier: tier !== undefined ? tier : products[index].tier
  };

  products[index] = updatedProduct;
  saveProductsToFile();

  // Invalidate cache
  cache.delete('products:all');

  res.json(updatedProduct);
});

// Delete a product by id
router.delete('/:id', (req, res) => {
  const id = req.params.id; // treat id as string
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products.splice(index, 1);
  saveProductsToFile();

  // Invalidate cache
  cache.delete('products:all');

  res.status(204).send();
});

module.exports = router;
