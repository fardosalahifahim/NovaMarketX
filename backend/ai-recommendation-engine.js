// AI Recommendation Engine with Selling Psychology Integration
const fs = require('fs');
const path = require('path');

class AIRecommendationEngine {
  constructor() {
    this.userBehaviorData = {};
    this.productAffinityMatrix = {};
    this.psychologyTriggers = {
      urgency: ['limited_stock', 'time_limited', 'last_chance', 'almost_gone'],
      socialProof: ['popular', 'trending', 'bestseller', 'customer_favorite'],
      scarcity: ['low_stock', 'limited_edition', 'exclusive', 'rare'],
      value: ['discount', 'special_offer', 'bundle', 'free_shipping']
    };
    this.loadBehaviorData();
  }

  // Load existing user behavior data
  loadBehaviorData() {
    try {
      const behaviorPath = path.join(__dirname, 'user-behavior.json');
      if (fs.existsSync(behaviorPath)) {
        const data = fs.readFileSync(behaviorPath, 'utf-8');
        this.userBehaviorData = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading user behavior data:', error);
      this.userBehaviorData = {};
    }
  }

  // Save user behavior data
  saveBehaviorData() {
    try {
      const behaviorPath = path.join(__dirname, 'user-behavior.json');
      fs.writeFileSync(behaviorPath, JSON.stringify(this.userBehaviorData, null, 2));
    } catch (error) {
      console.error('Error saving user behavior data:', error);
    }
  }

  // Track user behavior
  trackUserBehavior(userId, productId, action, metadata = {}) {
    if (!this.userBehaviorData[userId]) {
      this.userBehaviorData[userId] = {
        views: {},
        clicks: {},
        purchases: {},
        searches: [],
        lastActivity: new Date().toISOString()
      };
    }

    const userData = this.userBehaviorData[userId];
    userData.lastActivity = new Date().toISOString();

    switch (action) {
      case 'view':
        userData.views[productId] = (userData.views[productId] || 0) + 1;
        break;
      case 'click':
        userData.clicks[productId] = (userData.clicks[productId] || 0) + 1;
        break;
      case 'purchase':
        userData.purchases[productId] = (userData.purchases[productId] || 0) + (metadata.quantity || 1);
        break;
      case 'search':
        userData.searches.push({
          term: metadata.term,
          timestamp: new Date().toISOString()
        });
        // Keep only last 20 searches
        if (userData.searches.length > 20) {
          userData.searches = userData.searches.slice(-20);
        }
        break;
    }

    this.saveBehaviorData();
  }

  // Calculate product affinity scores
  calculateProductAffinity(userId, products) {
    const userData = this.userBehaviorData[userId] || {};
    const affinityScores = {};

    products.forEach(product => {
      let score = 0;

      // Base score from views
      score += (userData.views?.[product.id] || 0) * 0.5;

      // Higher score from clicks
      score += (userData.clicks?.[product.id] || 0) * 2;

      // Highest score from purchases
      score += (userData.purchases?.[product.id] || 0) * 5;

      // Search term matching
      const searchTerms = userData.searches?.map(s => s.term.toLowerCase()) || [];
      const productText = `${product.name} ${product.description} ${product.tags?.join(' ') || ''} ${product.categories?.join(' ') || ''}`.toLowerCase();

      searchTerms.forEach(term => {
        if (productText.includes(term.toLowerCase())) {
          score += 10;
        }
      });

      // Category preference
      const categoryViews = Object.entries(userData.views || {})
        .filter(([pid, count]) => {
          const viewedProduct = products.find(p => p.id === pid);
          return viewedProduct && viewedProduct.categories?.some(cat => 
            product.categories?.includes(cat)
          );
        })
        .reduce((sum, [_, count]) => sum + count, 0);

      score += categoryViews * 0.3;

      affinityScores[product.id] = Math.round(score * 100) / 100;
    });

    return affinityScores;
  }

  // Apply selling psychology triggers
  applyPsychologyTriggers(products, userId) {
    const userData = this.userBehaviorData[userId] || {};
    const triggeredProducts = products.map(product => {
      const enhancedProduct = { ...product };
      const triggers = [];

      // Urgency triggers
      if (product.stock < 10) {
        triggers.push({
          type: 'urgency',
          message: `Only ${product.stock} left in stock!`,
          level: 'high'
        });
      }

      if (product.createdAt && this.isNewProduct(product.createdAt)) {
        triggers.push({
          type: 'urgency',
          message: 'New arrival!',
          level: 'medium'
        });
      }

      // Social proof triggers
      const viewCount = Object.values(userData.views || {}).reduce((a, b) => a + b, 0);
      if (viewCount > 100) {
        triggers.push({
          type: 'socialProof',
          message: 'Popular choice among shoppers',
          level: 'medium'
        });
      }

      if (product.tags?.includes('bestseller')) {
        triggers.push({
          type: 'socialProof',
          message: 'Bestseller',
          level: 'high'
        });
      }

      // Scarcity triggers
      if (product.tags?.includes('limited')) {
        triggers.push({
          type: 'scarcity',
          message: 'Limited edition',
          level: 'high'
        });
      }

      // Value triggers
      if (product.price < 50) {
        triggers.push({
          type: 'value',
          message: 'Great value',
          level: 'low'
        });
      }

      enhancedProduct.psychologyTriggers = triggers;
      return enhancedProduct;
    });

    return triggeredProducts;
  }

  isNewProduct(createdAt) {
    const createdDate = new Date(createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate > sevenDaysAgo;
  }

  // Generate personalized recommendations
  async generateRecommendations(userId, allProducts, limit = 12) {
    const affinityScores = this.calculateProductAffinity(userId, allProducts);
    
    // Sort products by affinity score
    const sortedProducts = allProducts
      .map(product => ({
        ...product,
        affinityScore: affinityScores[product.id] || 0
      }))
      .sort((a, b) => b.affinityScore - a.affinityScore);

    // Apply psychology triggers
    const enhancedProducts = this.applyPsychologyTriggers(sortedProducts, userId);

    // Boost new products
    const boostedProducts = this.boostNewProducts(enhancedProducts);

    return boostedProducts.slice(0, limit);
  }

  // Boost new products in recommendations
  boostNewProducts(products) {
    return products.map(product => {
      let boost = 1.0;
      
      if (this.isNewProduct(product.createdAt)) {
        boost = 1.5; // 50% boost for new products
      }
      
      if (product.stock < 5) {
        boost *= 1.3; // Additional 30% boost for low stock
      }

      return {
        ...product,
        boostedScore: (product.affinityScore || 0) * boost
      };
    }).sort((a, b) => b.boostedScore - a.boostedScore);
  }

  // Get real-time recommendations based on current session
  getSessionRecommendations(sessionData, allProducts, limit = 8) {
    const sessionScores = {};

    allProducts.forEach(product => {
      let score = 0;

      // Score based on viewed products similarity
      sessionData.viewedProducts?.forEach(viewedId => {
        const viewedProduct = allProducts.find(p => p.id === viewedId);
        if (viewedProduct) {
          const similarity = this.calculateProductSimilarity(viewedProduct, product);
          score += similarity * 2;
        }
      });

      // Score based on search terms
      sessionData.searchTerms?.forEach(term => {
        const productText = `${product.name} ${product.description}`.toLowerCase();
        if (productText.includes(term.toLowerCase())) {
          score += 5;
        }
      });

      sessionScores[product.id] = score;
    });

    return allProducts
      .map(product => ({
        ...product,
        sessionScore: sessionScores[product.id] || 0
      }))
      .sort((a, b) => b.sessionScore - a.sessionScore)
      .slice(0, limit);
  }

  // Calculate product similarity
  calculateProductSimilarity(productA, productB) {
    let similarity = 0;

    // Category similarity
    const commonCategories = productA.categories?.filter(cat => 
      productB.categories?.includes(cat)
    ) || [];
    similarity += commonCategories.length * 2;

    // Tag similarity
    const commonTags = productA.tags?.filter(tag => 
      productB.tags?.includes(tag)
    ) || [];
    similarity += commonTags.length * 1.5;

    // Price similarity (within 20% range)
    const priceDiff = Math.abs(productA.price - productB.price);
    const avgPrice = (productA.price + productB.price) / 2;
    if (avgPrice > 0 && priceDiff / avgPrice < 0.2) {
      similarity += 3;
    }

    return similarity;
  }
}

module.exports = AIRecommendationEngine;
