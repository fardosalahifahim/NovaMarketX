const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AIRecommendationEngine = require('./ai-recommendation-engine');

// Initialize AI Recommendation Engine
const aiEngine = new AIRecommendationEngine();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Analytics data file path
const analyticsFilePath = path.join(__dirname, 'analytics.json');

// Load analytics data
let analyticsData = {
  locationStats: {},
  productStats: {},
  categoryStats: {},
  searchStats: {},
  searchLocationStats: {}
};

if (fs.existsSync(analyticsFilePath)) {
  try {
    const data = fs.readFileSync(analyticsFilePath, 'utf-8');
    analyticsData = JSON.parse(data);
  } catch (err) {
    console.error('Error reading analytics file:', err);
  }
}

// Favorites data file path
const favoritesFilePath = path.join(__dirname, 'favorites.json');

// Load favorites data
let favoritesData = {
  userFavorites: {}
};

if (fs.existsSync(favoritesFilePath)) {
  try {
    const data = fs.readFileSync(favoritesFilePath, 'utf-8');
    favoritesData = JSON.parse(data);
  } catch (err) {
    console.error('Error reading favorites file:', err);
  }
}

// Notifications data file path
const notificationsFilePath = path.join(__dirname, 'notification.json');

// Load notifications data
let notifications = [];

if (fs.existsSync(notificationsFilePath)) {
  try {
    const data = fs.readFileSync(notificationsFilePath, 'utf-8');
    notifications = JSON.parse(data);
  } catch (err) {
    console.error('Error reading notifications file:', err);
    notifications = [];
  }
}

// Helper function to save favorites data synchronously
function saveFavoritesData() {
  try {
    fs.writeFileSync(favoritesFilePath, JSON.stringify(favoritesData, null, 2));
    console.log('Favorites data saved successfully');
  } catch (err) {
    console.error('Error saving favorites data:', err);
  }
}

// API to get favorites for a user
app.get('/api/favorites/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  const userFavorites = favoritesData.userFavorites[userId] || [];
  res.json(userFavorites);
});

// API to add a favorite for a user
app.post('/api/favorites/:userId/add', (req, res) => {
  const userId = req.params.userId;
  const product = req.body;
  if (!userId || !product || !product.id) {
    return res.status(400).json({ error: 'User ID and product with id are required' });
  }
  if (!favoritesData.userFavorites[userId]) {
    favoritesData.userFavorites[userId] = [];
  }
  // Check if product already in favorites by id
  const existingIndex = favoritesData.userFavorites[userId].findIndex(p => p.id === product.id);
  if (existingIndex === -1) {
    favoritesData.userFavorites[userId].push(product);
    saveFavoritesData();
  }
  res.json(favoritesData.userFavorites[userId]);
});

// API to remove a favorite for a user
app.delete('/api/favorites/:userId/:productId', (req, res) => {
  const userId = req.params.userId;
  const productId = req.params.productId;
  if (!userId || !productId) {
    return res.status(400).json({ error: 'User ID and product ID are required' });
  }
  if (favoritesData.userFavorites[userId]) {
    favoritesData.userFavorites[userId] = favoritesData.userFavorites[userId].filter(product => product.id !== productId);
    saveFavoritesData();
  }
  res.json({ success: true, favorites: favoritesData.userFavorites[userId] });
});

// Helper function to save notifications data synchronously
function saveNotificationsData() {
  try {
    fs.writeFileSync(notificationsFilePath, JSON.stringify(notifications, null, 2));
    console.log('Notifications data saved successfully');
  } catch (err) {
    console.error('Error saving notifications data:', err);
  }
}

// API to get all notifications
app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

// API to get notifications for a specific user
app.get('/api/notifications/:userId', (req, res) => {
  const userId = req.params.userId;
  const userNotifications = notifications.filter(notification =>
    notification.userId === userId || notification.userId === 'all'
  );
  res.json(userNotifications);
});

// API to add a new notification
app.post('/api/notifications', (req, res) => {
  const { message, type = 'info', userId = 'all' } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const newNotification = {
    id: notifications.length ? notifications[notifications.length - 1].id + 1 : 1,
    message,
    type,
    timestamp: new Date().toISOString(),
    userId
  };

  notifications.push(newNotification);
  saveNotificationsData();

  // Broadcast notification to connected SSE clients
  sendNotificationsToClients(newNotification);

  res.status(201).json(newNotification);
});

// API to delete a notification by id
app.delete('/api/notifications/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = notifications.findIndex(notification => notification.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  notifications.splice(index, 1);
  saveNotificationsData();
  res.status(204).send();
});

// Helper function to save analytics data
function saveAnalyticsData() {
  fs.writeFile(analyticsFilePath, JSON.stringify(analyticsData, null, 2), (err) => {
    if (err) {
      console.error('Error saving analytics data:', err);
    }
  });
}

// Function to update analytics when order is placed
function updateOrderAnalytics(order) {
  // Update location stats
  const location = order.shippingAddress?.area || order.shippingAddress?.city || 'Unknown';
  analyticsData.locationStats[location] = (analyticsData.locationStats[location] || 0) + 1;
  
  // Update product and category stats
  const productIds = order.productDetails ? order.productDetails.map(p => p.id) : order.productIds || [];
  const quantities = order.productDetails ? order.productDetails.map(p => p.quantity || 1) : Array(productIds.length).fill(1);
  
  productIds.forEach((productId, index) => {
    const quantity = quantities[index];
    analyticsData.productStats[productId] = (analyticsData.productStats[productId] || 0) + quantity;
    
    // Update category stats
    const product = products.find(p => p.id === productId);
    if (product && product.categories) {
      product.categories.forEach(category => {
        analyticsData.categoryStats[category] = (analyticsData.categoryStats[category] || 0) + quantity;
      });
    }
  });
  
  saveAnalyticsData();
}

// Setup storage for uploaded images
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Serve uploaded images statically with caching headers
app.use('/uploads', express.static(uploadDir, {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true
}));

// User data file path and users array
const usersFilePath = path.join(__dirname, 'users.json');

const crypto = require('crypto');

let users = [];

// Load users from file if exists
if (fs.existsSync(usersFilePath)) {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    users = JSON.parse(data);

    // Assign unique string uid to users if not present
    users = users.map(user => {
      if (!user.uid) {
        user.uid = crypto.randomBytes(16).toString('hex');
      }
      return user;
    });
  } catch (err) {
    console.error('Error reading users file:', err);
    users = [];
  }
} else {
  users = [];
}

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Add a new user
app.post('/api/users', (req, res) => {
  const { username, email, phone, password } = req.body;
  if (!username || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  // Check if email already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    username,
    email,
    phone,
    password,
    emailVerified: false
  };
  users.push(newUser);
  fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error('Error saving users file:', err);
      return res.status(500).json({ error: 'Failed to save user' });
    }
    res.status(201).json(newUser);
  });
});

// Handle Google-authenticated user
app.post('/api/users/google', (req, res) => {
  const { uid, email, displayName } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and email are required' });
  }
  
  // Check if user already exists by UID or email
  const existingUser = users.find(u => u.uid === uid || u.email === email);
  if (existingUser) {
    // Update user info if needed
    if (displayName && existingUser.username !== displayName) {
      existingUser.username = displayName;
      // Save updated users to file
      fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
        if (err) {
          console.error('Error saving users file:', err);
        }
      });
    }
    return res.status(200).json(existingUser);
  }
  
  // Create new user
  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    username: displayName || email.split('@')[0],
    email,
    uid,
    emailVerified: true,
    // Add default values for other required fields
    phone: '',
    password: '' // Empty password for Google-authenticated users
  };
  users.push(newUser);
  fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error('Error saving users file:', err);
      return res.status(500).json({ error: 'Failed to save user' });
    }
    res.status(201).json(newUser);
  });
});

// Delete a user by id
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  users.splice(index, 1);
  fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error('Error saving users file:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    res.status(204).send();
  });
});

// Update a user by id
app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  const updatedUser = { ...users[index], ...req.body, id: users[index].id };
  users[index] = updatedUser;
  fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error('Error saving users file:', err);
      return res.status(500).json({ error: 'Failed to update user' });
    }
    res.json(updatedUser);
  });
});

const productsFilePath = path.join(__dirname, 'products.json');

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
      images: p.images || [], // New field for multiple images
      videos: p.videos || []  // New field for video links
    }));
  } catch (err) {
    console.error('Error reading products file:', err);
    products = [
      {
        id: '1',
        name: 'Sample Product 1',
        description: 'This is a sample product',
        price: 99.99,
        imageUrl: 'https://via.placeholder.com/150'
      }
    ];
  }
} else {
  products = [
    {
      id: '1',
      name: 'Sample Product 1',
      description: 'This is a sample product',
      price: 99.99,
      imageUrl: 'https://via.placeholder.com/150'
    }
  ];
}

// Helper function to save products to file
function saveProductsToFile() {
  fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
    if (err) {
      console.error('Error saving products file:', err);
    }
  });
}

// Get all products
app.get('/api/products', (req, res) => {
  // Ensure all products have createdAt field with default value
  const productsWithCreatedAt = products.map(product => ({
    ...product,
    createdAt: product.createdAt || new Date('2024-01-01T00:00:00.000Z').toISOString()
  }));
  res.json(productsWithCreatedAt);
});

// Get new/recent products (sorted by creation date, newest first)
app.get('/api/products/new', (req, res) => {
  const limit = parseInt(req.query.limit) || 20; // Default to 20 new products
  const page = parseInt(req.query.page) || 1;
  
  // Generate creation dates based on product order (newer products get more recent dates)
  const now = new Date();
  const productsWithCreatedAt = products.map((product, index) => {
    // If product already has createdAt, use it
    if (product.createdAt) {
      return product;
    }
    
    // Generate a creation date: newer products (higher index) get more recent dates
    // This assumes products are added in order in the array
    const daysAgo = products.length - index - 1; // Most recent product = 0 days ago
    const creationDate = new Date(now);
    creationDate.setDate(creationDate.getDate() - daysAgo);
    
    return {
      ...product,
      createdAt: creationDate.toISOString()
    };
  });
  
  // Sort by creation date, newest first
  const sortedProducts = [...productsWithCreatedAt].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  // Paginate results
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
  
  res.json({
    products: paginatedProducts,
    total: sortedProducts.length,
    page,
    totalPages: Math.ceil(sortedProducts.length / limit),
    hasNext: endIndex < sortedProducts.length,
    hasPrev: page > 1
  });
});

// Get product by name, description, tags or categories (search)
app.get('/api/products/name/:name', (req, res) => {
  const searchTerm = decodeURIComponent(req.params.name).toLowerCase();
  const matchedProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    (p.description && p.description.toLowerCase().includes(searchTerm)) ||
    (Array.isArray(p.tags) && p.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
    (Array.isArray(p.categories) && p.categories.some(cat => cat.toLowerCase().includes(searchTerm)))
  );
  if (matchedProducts.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(matchedProducts);
});

// Get product by id
app.get('/api/products/id/:id', (req, res) => {
  const id = req.params.id;
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Add a new product
app.post('/api/products', (req, res) => {
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
  console.log('Adding new product:', newProduct);
  products.push(newProduct);
  saveProductsToFile();
  res.status(201).json(newProduct);
});

// Update a product by id
app.put('/api/products/:id', (req, res) => {
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
  res.json(updatedProduct);
});

// Delete a product by id
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id; // treat id as string
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products.splice(index, 1);
  saveProductsToFile();
  res.status(204).send();
});

// Image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Directory for user-specific message files
const userMessagesDir = path.join(__dirname, 'userMessages');

// Create userMessages directory if it doesn't exist
if (!fs.existsSync(userMessagesDir)) {
  fs.mkdirSync(userMessagesDir);
}

// Helper function to get message file path for a user
function getUserMessagesFilePath(userId) {
  // Sanitize userId to prevent directory traversal
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(userMessagesDir, `${sanitizedUserId}.json`);
}

// Helper function to load messages for a specific user
function loadUserMessages(userId) {
  const filePath = getUserMessagesFilePath(userId);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading messages for user ${userId}:`, err);
      return [];
    }
  }
  return [];
}

// Helper function to save messages for a specific user
function saveUserMessages(userId, messages) {
  const filePath = getUserMessagesFilePath(userId);
  try {
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
    return true;
  } catch (err) {
    console.error(`Error saving messages for user ${userId}:`, err);
    return false;
  }
}

// Helper function to load all messages from all user files
function loadAllMessages() {
  let allMessages = [];
  try {
    const files = fs.readdirSync(userMessagesDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(userMessagesDir, file);
        const data = fs.readFileSync(filePath, 'utf-8');
        const userMessages = JSON.parse(data);
        allMessages = allMessages.concat(userMessages);
      }
    });
  } catch (err) {
    console.error('Error reading user message files:', err);
  }
  return allMessages;
}

// Helper function to save a message to both sender and receiver files
function saveMessageToUsers(message) {
  // Save to sender's file
  const senderMessages = loadUserMessages(message.senderId);
  // Check if message already exists to avoid duplicates
  if (!senderMessages.some(msg => msg.id === message.id)) {
    senderMessages.push(message);
    saveUserMessages(message.senderId, senderMessages);
  }
  
  // Save to receiver's file
  const receiverMessages = loadUserMessages(message.receiverId);
  // Check if message already exists to avoid duplicates
  if (!receiverMessages.some(msg => msg.id === message.id)) {
    receiverMessages.push(message);
    saveUserMessages(message.receiverId, receiverMessages);
  }
}

const ordersFilePath = path.join(__dirname, 'orders.json');

let orders = [];

// Load orders from file if exists
if (fs.existsSync(ordersFilePath)) {
  try {
    const data = fs.readFileSync(ordersFilePath, 'utf-8');
    orders = JSON.parse(data);
  } catch (err) {
    console.error('Error reading orders file:', err);
    orders = [];
  }
} else {
  orders = [];
}

// GET all orders or orders by userId
app.get('/api/orders', (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    const userOrders = orders.filter(order => order.userId === userId);
    res.json(userOrders);
  } else {
    res.json(orders);
  }
});

// DELETE an order by id
app.delete('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = orders.findIndex(order => order.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  orders.splice(index, 1);
  fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), (err) => {
    if (err) {
      console.error('Error saving orders file:', err);
      return res.status(500).json({ error: 'Failed to delete order' });
    }
    res.status(204).send();
  });
});

// PATCH update order status by id
app.patch('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  // Read orders fresh from file to avoid stale data
  fs.readFile(ordersFilePath, 'utf-8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading orders file:', readErr);
      return res.status(500).json({ error: 'Failed to read orders data' });
    }
    let currentOrders = [];
    try {
      currentOrders = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing orders file:', parseErr);
      currentOrders = [];
    }
    const index = currentOrders.findIndex(order => order.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldStatus = currentOrders[index].status;
    const userId = currentOrders[index].userId;

    // Only send notification if status actually changed
    if (oldStatus !== status) {
      // Create order status change notification
      const statusMessages = {
        processing: `Order #${id} is being processed`,
        confirmed: `Order #${id} has been confirmed`,
        shipping: `Order #${id} is on the way`,
        shipped: `Order #${id} has been shipped`,
        delivered: `Order #${id} has been delivered successfully`,
        canceled: `Order #${id} has been canceled`,
        returned: `Order #${id} return has been processed`
      };

      const statusTypes = {
        processing: 'info',
        confirmed: 'success',
        shipping: 'info',
        shipped: 'success',
        delivered: 'success',
        canceled: 'error',
        returned: 'warning'
      };

      const message = statusMessages[status] || `Order #${id} status updated to ${status}`;
      const type = statusTypes[status] || 'info';

      // Create notification for the user
      const orderNotification = {
        id: notifications.length ? notifications[notifications.length - 1].id + 1 : 1,
        message,
        type,
        timestamp: new Date().toISOString(),
        userId: userId || 'all',
        category: 'orders',
        priority: status === 'delivered' || status === 'canceled' ? 'high' : 'medium',
        persistent: status === 'delivered' || status === 'canceled'
      };

      // Add to notifications array and save
      notifications.push(orderNotification);
      saveNotificationsData();

      // Send notification to connected SSE clients
      sendNotificationsToClients(orderNotification);

      console.log(`Order ${id} status changed from ${oldStatus} to ${status}, notification sent to user ${userId}`);
    }

    currentOrders[index].status = status;
    fs.writeFile(ordersFilePath, JSON.stringify(currentOrders, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error saving orders file:', writeErr);
        return res.status(500).json({ error: 'Failed to update order' });
      }
      // Update in-memory orders array
      orders = currentOrders;
      res.json(currentOrders[index]);
    });
  });
});

// Add a new order
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  if (!newOrder) {
    return res.status(400).json({ error: 'Order data is required' });
  }
  // Read orders fresh from file to avoid stale data
  fs.readFile(ordersFilePath, 'utf-8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading orders file:', readErr);
      return res.status(500).json({ error: 'Failed to read orders data' });
    }
    let currentOrders = [];
    try {
      currentOrders = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing orders file:', parseErr);
      currentOrders = [];
    }
    // Assign new id
    newOrder.id = currentOrders.length ? currentOrders[currentOrders.length - 1].id + 1 : 1;
    currentOrders.push(newOrder);

    // Update product stock when order is placed
    if (newOrder.productDetails && Array.isArray(newOrder.productDetails)) {
      newOrder.productDetails.forEach(productDetail => {
        const productIndex = products.findIndex(p => p.id === productDetail.id);
        if (productIndex !== -1) {
          const quantity = productDetail.quantity || 1;
          // Decrement stock by the quantity purchased
          if (products[productIndex].stock !== null && products[productIndex].stock !== undefined && products[productIndex].stock > 0) {
            products[productIndex].stock = Math.max(0, products[productIndex].stock - quantity);
          }
          // Decrement maxBuyers by the quantity purchased
          if (products[productIndex].maxBuyers !== null && products[productIndex].maxBuyers !== undefined && products[productIndex].maxBuyers > 0) {
            products[productIndex].maxBuyers = Math.max(0, products[productIndex].maxBuyers - quantity);
          }
          // Decrement maxPerPerson by the quantity purchased
          if (products[productIndex].maxPerPerson !== null && products[productIndex].maxPerPerson !== undefined && products[productIndex].maxPerPerson > 0) {
            products[productIndex].maxPerPerson = Math.max(0, products[productIndex].maxPerPerson - quantity);
          }
          // If stock reaches 0, set outOfStockDate
          if (products[productIndex].stock === 0) {
            products[productIndex].outOfStockDate = new Date().toISOString();
          }
        }
      });
      // Save updated products to file
      saveProductsToFile();
    }

    fs.writeFile(ordersFilePath, JSON.stringify(currentOrders, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error saving orders file:', writeErr);
        return res.status(500).json({ error: 'Failed to save order' });
      }
      // Update in-memory orders array
      orders = currentOrders;
      // Update analytics when order is placed
      updateOrderAnalytics(newOrder);
      res.status(201).json(newOrder);
    });
  });
});

// Analytics endpoints
app.get('/api/analytics/locations', (req, res) => {
  res.json(analyticsData.locationStats);
});

app.get('/api/analytics/products', (req, res) => {
  // Enrich product stats with product details
  const enrichedProductStats = Object.entries(analyticsData.productStats).map(([productId, count]) => {
    const product = products.find(p => p.id === productId);
    return {
      productId,
      name: product ? product.name : 'Unknown Product',
      count,
      price: product ? product.price : 0,
      totalValue: product ? product.price * count : 0
    };
  }).sort((a, b) => b.count - a.count);
  
  res.json(enrichedProductStats);
});

app.get('/api/analytics/categories', (req, res) => {
  res.json(analyticsData.categoryStats);
});

app.get('/api/analytics/search', (req, res) => {
  res.json(analyticsData.searchStats);
});

app.get('/api/analytics/search-locations', (req, res) => {
  res.json(analyticsData.searchLocationStats);
});

// Update search analytics
app.post('/api/analytics/search', (req, res) => {
  const { searchTerm, location } = req.body;
  
  if (searchTerm) {
    analyticsData.searchStats[searchTerm] = (analyticsData.searchStats[searchTerm] || 0) + 1;
  }
  
  if (location) {
    analyticsData.searchLocationStats[location] = (analyticsData.searchLocationStats[location] || 0) + 1;
  }
  
  saveAnalyticsData();
  res.json({ success: true });
});

// AI Recommendation endpoints
app.post('/api/ai/track-behavior', (req, res) => {
  const { userId, productId, action, metadata } = req.body;
  
  if (!userId || !productId || !action) {
    return res.status(400).json({ error: 'userId, productId, and action are required' });
  }
  
  try {
    aiEngine.trackUserBehavior(userId, productId, action, metadata);
    res.json({ success: true, message: 'Behavior tracked successfully' });
  } catch (error) {
    console.error('Error tracking behavior:', error);
    res.status(500).json({ error: 'Failed to track behavior' });
  }
});

// Get AI-powered recommendations for user
app.get('/api/ai/recommendations/:userId', async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 12;
  
  try {
    const recommendations = await aiEngine.generateRecommendations(userId, products, limit);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get session-based recommendations
app.post('/api/ai/session-recommendations', async (req, res) => {
  const { sessionData } = req.body;
  const limit = parseInt(req.query.limit) || 8;
  
  if (!sessionData) {
    return res.status(400).json({ error: 'sessionData is required' });
  }
  
  try {
    const recommendations = aiEngine.getSessionRecommendations(sessionData, products, limit);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating session recommendations:', error);
    res.status(500).json({ error: 'Failed to generate session recommendations' });
  }
});

// Get new product recommendations with psychology triggers
app.get('/api/ai/new-products', async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const userId = req.query.userId || 'anonymous';
  
  try {
    // Get new products (created within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newProducts = products.filter(product => {
      const createdDate = new Date(product.createdAt || '2024-01-01');
      return createdDate > sevenDaysAgo;
    });
    
    // Apply psychology triggers
    const enhancedProducts = aiEngine.applyPsychologyTriggers(newProducts, userId);
    
    // Boost new products
    const boostedProducts = aiEngine.boostNewProducts(enhancedProducts);
    
    res.json(boostedProducts);
  } catch (error) {
    console.error('Error getting new products:', error);
    res.status(500).json({ error: 'Failed to get new products' });
  }
});

// Get trending products (combining sales and search data)
app.get('/api/ai/trending', async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  
  try {
    // Combine sales data and search data to find trending products
    const trendingProducts = products.map(product => {
      const salesScore = analyticsData.productStats[product.id] || 0;
      const searchScore = Object.entries(analyticsData.searchStats).reduce((score, [term, count]) => {
        const productText = `${product.name} ${product.description}`.toLowerCase();
        if (productText.includes(term.toLowerCase())) {
          return score + count;
        }
        return score;
      }, 0);
      
      return {
        ...product,
        trendingScore: salesScore * 2 + searchScore, // Weight sales more heavily
        salesCount: salesScore,
        searchMentions: searchScore
      };
    }).sort((a, b) => b.trendingScore - a.trendingScore);
    
    res.json(trendingProducts);
  } catch (error) {
    console.error('Error getting trending products:', error);
    res.status(500).json({ error: 'Failed to get trending products' });
  }
});

// Get popular products for homepage (best match products)
app.get('/api/products/popular', (req, res) => {
  // Get ALL products, not just limited subsets
  const allProducts = [...products];
  
  // Sort products to prioritize new products and popular ones
  const sortedProducts = allProducts.sort((a, b) => {
    // Prioritize products with sales history
    const aSales = analyticsData.productStats[a.id] || 0;
    const bSales = analyticsData.productStats[b.id] || 0;
    
    // Prioritize newer products
    const aIsNew = a.createdAt ? new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false;
    const bIsNew = b.createdAt ? new Date(b.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false;
    
    // New products get highest priority, then by sales
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return bSales - aSales;
  });

  // Return ALL products, not just a limited subset
  res.json(sortedProducts);
});

// Get popular products by location
app.get('/api/products/popular/:location', (req, res) => {
  const location = decodeURIComponent(req.params.location);
  
  // For now, we'll return global popular products since we don't have location-specific sales data
  // In a real implementation, you would filter orders by location and then get popular products
  const popularProducts = products
    .filter(product => analyticsData.productStats[product.id])
    .sort((a, b) => (analyticsData.productStats[b.id] || 0) - (analyticsData.productStats[a.id] || 0));
  
  // Get new products (without sales history)
  const newProducts = products
    .filter(product => !analyticsData.productStats[product.id])
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); // Sort by creation date, newest first
  
  // Combine popular and new products, with more emphasis on new products
const combinedProducts = [
  ...popularProducts, // Return all popular products
  ...newProducts      // Return all new products
];
  
  // Shuffle the products to show different ones each time
  const shuffledProducts = shuffleArray([...combinedProducts]);
  
  res.json(shuffledProducts);
});

// Get most searched products by location
app.get('/api/products/searched/:location', (req, res) => {
  const location = decodeURIComponent(req.params.location);
  
  // Get search terms for this location
  const locationSearchStats = analyticsData.searchLocationStats[location] || 0;
  
  // For now, return global popular products since we don't have location-specific search data structure
  // In a real implementation, you would track which products were searched for in each location
  const searchedProducts = products
    .filter(product => analyticsData.productStats[product.id])
    .sort((a, b) => (analyticsData.productStats[b.id] || 0) - (analyticsData.productStats[a.id] || 0));
  
  // Get new products (without sales history)
  const newProducts = products
    .filter(product => !analyticsData.productStats[product.id])
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); // Sort by creation date, newest first
  
  // Combine searched and new products, with priority to searched ones
  const combinedProducts = [
    ...searchedProducts.slice(0, 8), // Top 8 searched products
    ...newProducts.slice(0, 4)       // Top 4 new products
  ];
  
  // Shuffle the products to show different ones each time
  const shuffledProducts = shuffleArray([...combinedProducts]).slice(0, 12);
  
  res.json(shuffledProducts);
});

// Get location-based recommendations (both popular and searched)
app.get('/api/products/location/:location', (req, res) => {
  const location = decodeURIComponent(req.params.location);
  
  // Get ALL products, not just limited subsets
  const allProducts = [...products];
  
  // Sort products to prioritize new products and popular ones
  const sortedProducts = allProducts.sort((a, b) => {
    // Prioritize products with sales history
    const aSales = analyticsData.productStats[a.id] || 0;
    const bSales = analyticsData.productStats[b.id] || 0;
    
    // Prioritize newer products
    const aIsNew = a.createdAt ? new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false;
    const bIsNew = b.createdAt ? new Date(b.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false;
    
    // New products get highest priority, then by sales
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return bSales - aSales;
  });

  // Shuffle the products to show different ones each time
  const shuffledProducts = shuffleArray([...sortedProducts]);

  // Get top search terms for this location
  const locationSearchCount = analyticsData.searchLocationStats[location] || 0;
  
  // Get top search terms (we'll simulate this since we don't have per-location search terms)
  const topSearchTerms = Object.entries(analyticsData.searchStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([term]) => term.toLowerCase());
  
  res.json({
    location,
    products: shuffledProducts, // Return shuffled products for dynamic display
    searchTerms: topSearchTerms,
    total: shuffledProducts.length
  });
});

// Dynamic product listing endpoint - rotates between different strategies
app.get('/api/products/dynamic', async (req, res) => {
  const { strategy, userId, location, limit } = req.query;
  const productsLimit = parseInt(limit) || 20;
  const userLocation = location || 'Unknown';
  
  try {
    let dynamicProducts = [];
    let currentStrategy = strategy;
    
    // If no specific strategy provided, rotate through available strategies
    if (!currentStrategy) {
      const strategies = ['ai', 'new', 'location', 'all'];
      const strategyIndex = Math.floor(Math.random() * strategies.length);
      currentStrategy = strategies[strategyIndex];
    }
    
    switch (currentStrategy) {
      case 'ai':
        // AI Recommendations
        if (userId && userId !== 'anonymous') {
          dynamicProducts = await aiEngine.generateRecommendations(userId, products, productsLimit);
        } else {
          // Fallback to popular products for anonymous users
          const popularRes = await fetch(`http://localhost:${PORT}/api/products/popular?limit=${productsLimit}`);
          if (popularRes.ok) {
            dynamicProducts = await popularRes.json();
          }
        }
        break;
        
      case 'new':
        // New Products
        const newRes = await fetch(`http://localhost:${PORT}/api/products/new?limit=${productsLimit}`);
        if (newRes.ok) {
          const newData = await newRes.json();
          dynamicProducts = newData.products || newData;
        }
        break;
        
      case 'location':
        // Location-based products
        const locationRes = await fetch(`http://localhost:${PORT}/api/products/location/${encodeURIComponent(userLocation)}`);
        if (locationRes.ok) {
          const locationData = await locationRes.json();
          dynamicProducts = locationData.combined || [];
        }
        break;
        
      case 'all':
      default:
        // All products with smart filtering (limit and shuffle)
        const allProducts = [...products];
        dynamicProducts = shuffleArray(allProducts).slice(0, productsLimit);
        break;
    }
    
    // Ensure we have products (fallback to all products if empty)
    if (!dynamicProducts || dynamicProducts.length === 0) {
      dynamicProducts = shuffleArray([...products]).slice(0, productsLimit);
    }
    
    res.json({
      products: dynamicProducts,
      strategy: currentStrategy,
      location: userLocation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in dynamic products endpoint:', error);
    // Fallback to all products on error
    const fallbackProducts = shuffleArray([...products]).slice(0, productsLimit);
    res.json({
      products: fallbackProducts,
      strategy: 'fallback',
      location: userLocation,
      timestamp: new Date().toISOString(),
      error: 'Failed to load dynamic products'
    });
  }
});

// Featured products file path
const featuredProductsFilePath = path.join(__dirname, 'featured-products.json');

// Load featured products configuration
let featuredProductsConfig = [];
if (fs.existsSync(featuredProductsFilePath)) {
  try {
    const data = fs.readFileSync(featuredProductsFilePath, 'utf-8');
    featuredProductsConfig = JSON.parse(data);
  } catch (err) {
    console.error('Error reading featured products file:', err);
  }
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to get manually curated featured products
function getManualFeaturedProducts(allProducts, limit = 12) {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const activeFeatured = featuredProductsConfig.filter(config => {
    const isActive = (!config.startDate || config.startDate <= currentDate) &&
                     (!config.endDate || config.endDate >= currentDate);
    return isActive && allProducts.find(p => p.id === config.productId);
  });

  // Sort by priority (highest first)
  activeFeatured.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const featuredProducts = activeFeatured.map(config => {
    const product = allProducts.find(p => p.id === config.productId);
    return {
      ...product,
      featuredMetadata: {
        type: 'manual',
        priority: config.priority,
        title: config.title,
        description: config.description,
        tags: config.tags || []
      }
    };
  });

  return featuredProducts;
}

// Helper function to get AI-based featured products
async function getAIFeaturedProducts(userId, allProducts, limit = 12) {
  try {
    const recommendations = await aiEngine.generateRecommendations(userId, allProducts, limit * 2);
    const featured = recommendations.map(product => ({
      ...product,
      featuredMetadata: {
        type: 'ai',
        affinityScore: product.affinityScore,
        boostedScore: product.boostedScore,
        psychologyTriggers: product.psychologyTriggers || []
      }
    }));
    return featured.slice(0, limit);
  } catch (error) {
    console.error('Error getting AI featured products:', error);
    return [];
  }
}

// Helper function to get popular featured products
function getPopularFeaturedProducts(allProducts, analytics, limit = 12) {
  const productsWithSales = allProducts.map(product => {
    const sales = analytics.productStats[product.id] || 0;
    return {
      ...product,
      salesCount: sales
    };
  });

  const popularProducts = productsWithSales
    .filter(product => product.salesCount > 0)
    .sort((a, b) => b.salesCount - a.salesCount)
    .map(product => ({
      ...product,
      featuredMetadata: {
        type: 'popular',
        salesCount: product.salesCount,
        reason: `Bestseller with ${product.salesCount} sales`
      }
    }));

  return popularProducts;
}

// Helper function to get new featured products
function getNewFeaturedProducts(allProducts, limit = 12) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newProducts = allProducts
    .filter(product => {
      const createdDate = new Date(product.createdAt || '2024-01-01');
      return createdDate > sevenDaysAgo;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map(product => ({
      ...product,
      featuredMetadata: {
        type: 'new',
        isNew: true,
        reason: 'New arrival'
      }
    }));

  return newProducts;
}

// Helper function to get hybrid featured products (combination of strategies)
async function getHybridFeaturedProducts(userId, allProducts, analytics, limit = 12) {
  const strategies = [
    getManualFeaturedProducts(allProducts, Math.ceil(limit * 0.3)),
    await getAIFeaturedProducts(userId, allProducts, Math.ceil(limit * 0.3)),
    getPopularFeaturedProducts(allProducts, analytics, Math.ceil(limit * 0.2)),
    getNewFeaturedProducts(allProducts, Math.ceil(limit * 0.2))
  ];

  const results = await Promise.all(strategies);
  const allFeatured = results.flat();
  
  // Remove duplicates
  const uniqueProducts = [];
  const seenIds = new Set();
  
  for (const product of allFeatured) {
    if (!seenIds.has(product.id)) {
      seenIds.add(product.id);
      uniqueProducts.push(product);
    }
  }

  return uniqueProducts;
}

// Featured products endpoint
app.get('/api/products/featured', async (req, res) => {
  const { strategy = 'hybrid', userId, location, limit = 12 } = req.query;
  const productsLimit = parseInt(limit) || 12;
  
  try {
    let featuredProducts = [];
    
    switch (strategy.toLowerCase()) {
      case 'manual':
        featuredProducts = getManualFeaturedProducts(products, productsLimit);
        break;
        
      case 'ai':
        const aiUser = userId || 'anonymous';
        featuredProducts = await getAIFeaturedProducts(aiUser, products, productsLimit);
        break;
        
      case 'popular':
        featuredProducts = getPopularFeaturedProducts(products, analyticsData, productsLimit);
        break;
        
      case 'new':
        featuredProducts = getNewFeaturedProducts(products, productsLimit);
        break;
        
      case 'hybrid':
      default:
        const hybridUser = userId || 'anonymous';
        featuredProducts = await getHybridFeaturedProducts(hybridUser, products, analyticsData, productsLimit);
        break;
    }
    
    // Ensure we have products (fallback to manual if empty)
    if (!featuredProducts || featuredProducts.length === 0) {
      featuredProducts = getManualFeaturedProducts(products, productsLimit);
    }
    
    // If still empty, fallback to popular products
    if (featuredProducts.length === 0) {
      featuredProducts = getPopularFeaturedProducts(products, analyticsData, productsLimit);
    }
    
    res.json({
      products: featuredProducts,
      strategy: strategy.toLowerCase(),
      total: featuredProducts.length,
      userId: userId || 'anonymous',
      location: location || 'global',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in featured products endpoint:', error);
    
    // Fallback to manual featured products on error
    const fallbackProducts = getManualFeaturedProducts(products, productsLimit);
    res.json({
      products: fallbackProducts,
      strategy: 'fallback',
      total: fallbackProducts.length,
      userId: userId || 'anonymous',
      location: location || 'global',
      timestamp: new Date().toISOString(),
      error: 'Failed to load featured products, using fallback'
    });
  }
});

// Get search results sorted by popularity
app.get('/api/products/search/popular/:query', (req, res) => {
  const searchTerm = decodeURIComponent(req.params.query).toLowerCase();
  const location = req.query.location || 'Unknown';
  
  // Update search analytics
  analyticsData.searchStats[searchTerm] = (analyticsData.searchStats[searchTerm] || 0) + 1;
  analyticsData.searchLocationStats[location] = (analyticsData.searchLocationStats[location] || 0) + 1;
  saveAnalyticsData();
  
  const matchedProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    (p.description && p.description.toLowerCase().includes(searchTerm)) ||
    (Array.isArray(p.tags) && p.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
    (Array.isArray(p.categories) && p.categories.some(cat => cat.toLowerCase().includes(searchTerm)))
  );
  
  // Sort by popularity (number of sales)
  const sortedProducts = matchedProducts.sort((a, b) => {
    const aSales = analyticsData.productStats[a.id] || 0;
    const bSales = analyticsData.productStats[b.id] || 0;
    return bSales - aSales;
  });
  
  if (sortedProducts.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(sortedProducts);
});

// Helper function to save FAQ messages to file
function saveFaqMessagesToFile() {
  fs.writeFile(faqMessagesFilePath, JSON.stringify(faqMessages, null, 2), (err) => {
    if (err) {
      console.error('Error saving FAQ messages file:', err);
    }
  });
}

// GET all FAQ messages
app.get('/api/faq-messages', (req, res) => {
  const allMessages = loadAllMessages();
  res.json(allMessages);
});

// GET all messages for admin panel (including FAQ messages)
// SSE clients array
const sseClients = [];

// Notification SSE clients array
const notificationClients = [];

// Helper function to find user by uid or id
function findUserById(userId) {
  return users.find(u => u.uid === userId || String(u.id) === String(userId));
}

// POST a new FAQ message
app.post('/api/faq-messages', (req, res) => {
  const { content, senderId, receiverId } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'senderId and receiverId are required' });
  }
  
  // Ensure messages are only between user and admin
  const adminId = 'animespring';
  const isAdminSending = senderId === adminId;
  const isAdminReceiving = receiverId === adminId;
  
  // If neither sender nor receiver is admin, reject
  if (!isAdminSending && !isAdminReceiving) {
    return res.status(403).json({ error: 'Messages can only be sent between user and admin' });
  }
  
  // Load all messages to determine next ID
  const allMessages = loadAllMessages();
  const newMessage = {
    id: allMessages.length ? allMessages[allMessages.length - 1].id + 1 : 1,
    content,
    senderId: String(senderId),
    receiverId: String(receiverId),
    timestamp: new Date().toISOString()
  };
  
  // Save message to both sender and receiver files
  saveMessageToUsers(newMessage);
  
  // Send events to all relevant clients
  const sender = users.find(u => String(u.id) === String(senderId) || u.uid === String(senderId));
  const receiver = users.find(u => String(u.id) === String(receiverId) || u.uid === String(receiverId));
  
  const enrichedMessage = {
    ...newMessage,
    senderUsername: sender ? sender.username : 'Unknown User',
    receiverUsername: receiverId === adminId ? 'animespring' : (receiver ? receiver.username : 'Unknown User')
  };
  
  // Send real-time update to dashboard clients
  sendEventsToAll(enrichedMessage);
  res.status(201).json(enrichedMessage);
});

app.get('/api/messages', (req, res) => {
  const userId = req.query.userId;
  const adminId = 'animespring'; // fixed admin id string
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }
  
  // Load messages for this user
  const userMessages = loadUserMessages(userId);
  
  // Return messages where (senderId === adminId and receiverId === userId) or vice versa
  const enrichedMessages = userMessages
    .filter(msg =>
      (msg.senderId === adminId && msg.receiverId === userId) ||
      (msg.senderId === userId && msg.receiverId === adminId)
    )
    .map(msg => {
      const sender = users.find(u => String(u.id) === String(msg.senderId) || u.uid === String(msg.senderId));
      const receiver = users.find(u => String(u.id) === String(msg.receiverId) || u.uid === String(msg.receiverId));
      return {
        ...msg,
        senderUsername: sender ? sender.username : 'Unknown User',
        receiverUsername: msg.receiverId === adminId ? 'animespring' : (receiver ? receiver.username : 'Unknown User')
      };
    });
  res.json(enrichedMessages);
});

// SSE endpoint for real-time notifications
app.get('/api/notifications/stream', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    res.status(400).end('userId query parameter is required');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Send initial notifications for this user
  const userNotifications = notifications.filter(notification =>
    notification.userId === userId || notification.userId === 'all'
  );
  const data = JSON.stringify(userNotifications);
  res.write(`data: ${data}\n\n`);

  // Add client to notification clients array
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
    userId: userId
  };
  notificationClients.push(newClient);

  // Remove client on close
  req.on('close', () => {
    const index = notificationClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      notificationClients.splice(index, 1);
    }
  });
});

// SSE endpoint for real-time messages
app.get('/api/messages/stream', (req, res) => {
  const userId = req.query.userId;
  const isAdmin = req.query.isAdmin === 'true';
  const adminId = 'animespring'; // fixed admin id string
  if (!userId && !isAdmin) {
    res.status(400).end('userId query parameter or isAdmin=true is required');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // For admin clients, send all messages between any user and admin
  if (isAdmin) {
    console.log('Admin client connected'); // Debug log
    // Send initial data for admin (all messages between users and admin)
    const allMessages = loadAllMessages();
    console.log('Loaded all messages:', allMessages.length); // Debug log
    const enrichedMessages = allMessages
      .filter(msg => msg.senderId === adminId || msg.receiverId === adminId)
      .map(msg => {
        const sender = users.find(u => String(u.id) === String(msg.senderId) || u.uid === String(msg.senderId));
        const receiver = users.find(u => String(u.id) === String(msg.receiverId) || u.uid === String(msg.receiverId));
        return {
          ...msg,
          senderUsername: sender ? sender.username : 'Unknown User',
          receiverUsername: msg.receiverId === adminId ? 'animespring' : (receiver ? receiver.username : 'Unknown User')
        };
      });
      
    const data = JSON.stringify(enrichedMessages);
    console.log('Sending initial data to admin:', enrichedMessages.length); // Debug log
    res.write(`data: ${data}\n\n`);

    // Add admin client to clients array
    const clientId = Date.now();
    const newClient = {
      id: clientId,
      res,
      isAdmin: true
    };
    sseClients.push(newClient);
    console.log('Admin client added to sseClients'); // Debug log

    // Remove client on close
    req.on('close', () => {
      const index = sseClients.findIndex(c => c.id === clientId);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
      console.log('Admin client disconnected'); // Debug log
    });
  } else {
    console.log('User client connected, userId:', userId); // Debug log
    // For user clients, send messages between that user and admin
    // Send initial data filtered by userId (uid or id)
    const userMessages = loadUserMessages(userId);
    console.log('Loaded user messages:', userMessages.length); // Debug log
    const enrichedMessages = userMessages
      .filter(msg =>
        (msg.senderId === adminId && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === adminId)
      )
      .map(msg => {
        const sender = users.find(u => String(u.id) === String(msg.senderId) || u.uid === String(msg.senderId));
        const receiver = users.find(u => String(u.id) === String(msg.receiverId) || u.uid === String(msg.receiverId));
        return {
          ...msg,
          senderUsername: sender ? sender.username : 'Unknown User',
          receiverUsername: msg.receiverId === adminId ? 'animespring' : (receiver ? receiver.username : 'Unknown User')
        };
      });
      
    const data = JSON.stringify(enrichedMessages);
    console.log('Sending initial data to user:', enrichedMessages.length); // Debug log
    res.write(`data: ${data}\n\n`);

    // Add client to clients array with userId (uid or id)
    const clientId = Date.now();
    const newClient = {
      id: clientId,
      res,
      userId: userId
    };
    sseClients.push(newClient);
    console.log('User client added to sseClients'); // Debug log

    // Remove client on close
    req.on('close', () => {
      const index = sseClients.findIndex(c => c.id === clientId);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
      console.log('User client disconnected'); // Debug log
    });
  }
});

// Remove the old faqMessages array and saveFaqMessagesToFile function since we're using individual files now
// const faqMessages = []; // This is no longer needed
// function saveFaqMessagesToFile() {} // This is no longer needed

// banner.json file path
const bannerFilePath = path.join(__dirname, 'banner.json');

// GET banner data (return array of banners)
app.get('/api/banner', (req, res) => {
  if (!fs.existsSync(bannerFilePath)) {
    return res.status(404).json({ error: 'Banner data not found' });
  }
  try {
    const data = fs.readFileSync(bannerFilePath, 'utf-8');
    const banners = JSON.parse(data);
    res.json(banners);
  } catch (err) {
    console.error('Error reading banner file:', err);
    res.status(500).json({ error: 'Failed to read banner data' });
  }
});

const url = require('url');

// POST add new banner
app.post('/api/banner', (req, res) => {
  const { title, description, imageUrl, buttonText, tags } = req.body;
  if (!title || !description || !imageUrl) {
    return res.status(400).json({ error: 'title, description, and imageUrl are required' });
  }
  let banners = [];
  if (fs.existsSync(bannerFilePath)) {
  try {
    const data = fs.readFileSync(bannerFilePath, 'utf-8');
    banners = JSON.parse(data);
  } catch (err) {
    console.error('Error reading banner file:', err);
    return res.status(500).json({ error: 'Failed to read banner data' });
  }
  }
  const newBanner = {
    id: banners.length ? banners[banners.length - 1].id + 1 : 1,
    title,
    description,
    imageUrl,
    buttonText: buttonText || '',
    tags: Array.isArray(tags) ? tags : []
  };
  banners.push(newBanner);
  fs.writeFile(bannerFilePath, JSON.stringify(banners, null, 2), (err) => {
    if (err) {
      console.error('Error saving banner file:', err);
      return res.status(500).json({ error: 'Failed to save banner data' });
    }
    res.status(201).json(newBanner);
  });
});

// PUT update banner data (replace entire array)
app.put('/api/banner', (req, res) => {
  const banners = req.body;
  if (!Array.isArray(banners)) {
    return res.status(400).json({ error: 'Array of banners is required' });
  }
  fs.writeFile(bannerFilePath, JSON.stringify(banners, null, 2), (err) => {
    if (err) {
      console.error('Error saving banner file:', err);
      return res.status(500).json({ error: 'Failed to save banner data' });
    }
    res.status(200).json(banners);
  });
});

// PATCH update individual banner by id
app.patch('/api/banner/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, description, imageUrl, buttonText, tags } = req.body;
  
  if (!fs.existsSync(bannerFilePath)) {
    return res.status(404).json({ error: 'Banner data not found' });
  }
  
  try {
    const data = fs.readFileSync(bannerFilePath, 'utf-8');
    let banners = JSON.parse(data);
    
    const index = banners.findIndex(banner => banner.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    const updatedBanner = {
      ...banners[index],
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(buttonText !== undefined && { buttonText }),
      ...(tags !== undefined && { tags })
    };
    
    banners[index] = updatedBanner;
    
    fs.writeFile(bannerFilePath, JSON.stringify(banners, null, 2), (err) => {
      if (err) {
        console.error('Error saving banner file:', err);
        return res.status(500).json({ error: 'Failed to save banner data' });
      }
      res.json(updatedBanner);
    });
  } catch (err) {
    console.error('Error updating banner:', err);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// DELETE banner by id
app.delete('/api/banner/:id', (req, res) => {
  const id = Number(req.params.id);
  
  if (!fs.existsSync(bannerFilePath)) {
    return res.status(404).json({ error: 'Banner data not found' });
  }
  
  try {
    const data = fs.readFileSync(bannerFilePath, 'utf-8');
    let banners = JSON.parse(data);
    
    const index = banners.findIndex(banner => banner.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    banners.splice(index, 1);
    
    fs.writeFile(bannerFilePath, JSON.stringify(banners, null, 2), (err) => {
      if (err) {
        console.error('Error saving banner file:', err);
        return res.status(500).json({ error: 'Failed to delete banner' });
      }
      res.status(204).send();
    });
  } catch (err) {
    console.error('Error deleting banner:', err);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

let clients = [];

// Function to send events to all connected dashboard clients
function sendEventsToAll(data) {
  clients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error('Error sending data to client:', err);
    }
  });
}

// Function to send notifications to connected clients
function sendNotificationsToClients(notification) {
  notificationClients.forEach(client => {
    try {
      // Send notification if it's for this user or for all users
      if (notification.userId === client.userId || notification.userId === 'all') {
        client.res.write(`data: ${JSON.stringify([notification])}\n\n`);
      }
    } catch (err) {
      console.error('Error sending notification to client:', err);
    }
  });
}

function readJSON(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
      return [];
    }
  }
  return [];
}

function getLastNDaysDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function aggregateRevenueData(orders, days) {
  const dates = getLastNDaysDates(days);
  const revenueData = dates.map(date => {
    const dailyOrders = orders.filter(order => order.orderDate.startsWith(date) && order.status !== 'canceled');
    const revenue = dailyOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    return {
      date: `Day ${dates.indexOf(date) + 1}`,
      revenue,
      orders: dailyOrders.length,
    };
  });
  return revenueData;
}

function aggregateTopCategories(orders, products) {
  const categorySales = {};
  orders.forEach(order => {
    if (order.status === 'canceled') return;
    
    // Handle both old productIds structure and new productDetails structure
    if (order.productDetails && Array.isArray(order.productDetails)) {
      order.productDetails.forEach(productDetail => {
        const product = products.find(p => p.id === productDetail.id);
        if (product) {
          product.categories.forEach(cat => {
            // Multiply price by quantity for accurate sales calculation
            const salesValue = product.price * (productDetail.quantity || 1);
            categorySales[cat] = (categorySales[cat] || 0) + salesValue;
          });
        }
      });
    } else if (order.productIds && Array.isArray(order.productIds)) {
      order.productIds.forEach(pid => {
        const product = products.find(p => p.id === pid);
        if (product) {
          product.categories.forEach(cat => {
            categorySales[cat] = (categorySales[cat] || 0) + product.price;
          });
        }
      });
    }
  });
  return Object.entries(categorySales).map(([name, value]) => ({ name, value }));
}

function getTotalSales(orders) {
  return orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalPrice, 0);
}

function getTotalOrders(orders) {
  // Count orders with status processing, shipping, or confirmed
  return orders.filter(o => ['processing', 'shipping', 'confirmed'].includes(o.status)).length;
}

function getTotalVisitors(users) {
  return users.length;
}

function getActiveUsers(orders) {
  const activeUserIds = new Set();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  orders.forEach(order => {
    if (order.status !== 'canceled' && new Date(order.orderDate) >= oneMonthAgo) {
      activeUserIds.add(order.userId);
    }
  });
  return activeUserIds.size;
}

setInterval(() => {
  const orders = readJSON(path.join(__dirname, 'orders.json'));
  const products = readJSON(path.join(__dirname, 'products.json'));
  const users = readJSON(path.join(__dirname, 'users.json'));

  const totalSales = getTotalSales(orders);
  // Calculate total quantity of products successfully delivered
  const totalDeliveredSales = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => {
      // Handle both old productIds structure and new productDetails structure
      if (o.productDetails && Array.isArray(o.productDetails)) {
        return sum + o.productDetails.reduce((qtySum, item) => qtySum + (item.quantity || 1), 0);
      } else if (o.productIds && Array.isArray(o.productIds)) {
        return sum + o.productIds.length;
      }
      return sum;
    }, 0);
  const totalOrders = getTotalOrders(orders);
  const totalVisitors = getTotalVisitors(users);
  const revenueData = aggregateRevenueData(orders, 7);
  const topCategories = aggregateTopCategories(orders, products);
  const activeUsers = getActiveUsers(orders);

  const data = {
    totalSales,
    totalDeliveredSales,
    totalSalesChange: 3.34, // Placeholder, can be computed
    totalOrders,
    totalOrdersChange: -2.89, // Placeholder
    totalVisitors,
    totalVisitorsChange: 8.02, // Placeholder
    revenueData,
    monthlyTarget: {
      percent: 85,
      change: 8.02,
      target: 600000,
      revenue: 510000,
    },
    activeUsers,
    activeUsersChange: 8.02,
    activeUsersByCountry: [
      { country: 'United States', percent: 36 },
      { country: 'United Kingdom', percent: 24 },
      { country: 'Indonesia', percent: 17.5 },
      { country: 'Russia', percent: 15 },
    ],
    conversionRateData: [
      { name: 'Product Views', value: 25000, change: 9 },
      { name: 'Add to Cart', value: 12000, change: 6 },
      { name: 'Proceed to Checkout', value: 8500, change: 4 },
      { name: 'Completed Purchases', value: 6200, change: 7 },
      { name: 'Abandoned Carts', value: 3000, change: -5 },
    ],
    topCategories,
    trafficData: [
      { name: 'Direct Traffic', value: 40 },
      { name: 'Organic Search', value: 30 },
      { name: 'Social Media', value: 15 },
      { name: 'Referral Traffic', value: 10 },
      { name: 'Email Campaigns', value: 5 },
    ],
  };
  sendEventsToAll(data);
}, 10000);

app.get('/api/realtime-dashboard', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
