const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { resolveConflict } = require('../engine/decisionEngine');

/**
 * POST /api/resolve
 * Body: { users: [...], mode: 'democracy'|'priority', history: [] }
 */
router.post('/resolve', async (req, res) => {
  try {
    const { users, mode, history } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one user preference.' });
    }

    const restaurants = await Restaurant.find({});
    if (restaurants.length === 0) {
      return res.status(404).json({ error: 'No restaurants in database. Please seed data.' });
    }

    const result = resolveConflict({ users, restaurants, mode, history });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /api/restaurants
 * Returns all restaurants.
 */
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/seed
 * Seeds sample restaurants into DB.
 */
router.post('/seed', async (req, res) => {
  try {
    await Restaurant.deleteMany({});
    const cities = {
      Bangalore: { Indiranagar: { lat: 12.9783, lng: 77.6408 }, Koramangala: { lat: 12.9279, lng: 77.6271 }, Whitefield: { lat: 12.9698, lng: 77.7499 }, Jayanagar: { lat: 12.9298, lng: 77.5800 } },
      Hyderabad: { 'Banjara Hills': { lat: 17.4156, lng: 78.4347 }, 'Jubilee Hills': { lat: 17.4300, lng: 78.4069 }, 'Hitec City': { lat: 17.4435, lng: 78.3772 }, Gachibowli: { lat: 17.4400, lng: 78.3489 } },
      Chennai: { 'T Nagar': { lat: 13.0418, lng: 80.2341 }, 'Anna Nagar': { lat: 13.0850, lng: 80.2101 }, Velachery: { lat: 12.9757, lng: 80.2212 }, Adyar: { lat: 13.0012, lng: 80.2565 } }
    };
    
    const adjectives = ['Grand', 'Royal', 'Spice', 'Green', 'Golden', 'Fusion', 'Happy', 'Hidden', 'Midnight', 'Sizzling'];
    const nouns = ['Bites', 'Bowl', 'Garden', 'Palace', 'Kitchen', 'Hub', 'Fiesta', 'Diner', 'Cafe', 'Grill'];
    const cuisines = ['Indian', 'Chinese', 'Italian', 'American', 'Japanese', 'Continental', 'Multi-Cuisine'];
    const dietsArray = [['veg'], ['veg', 'non-veg'], ['veg', 'vegan'], ['veg', 'non-veg', 'vegan']];
    const spices = ['mild', 'medium', 'spicy'];
    
    const sampleRestaurants = [];
    let counter = 1;
    
    // Slight randomization for locations so they don't have exactly the same lat/lng
    const jitter = () => (Math.random() - 0.5) * 0.015;

    for (const [city, areas] of Object.entries(cities)) {
      for (const [area, coords] of Object.entries(areas)) {
        // Generate ~8 restaurants per area (8 * 4 * 3 = 96), we'll do 9 per area to get > 100
        for (let i = 0; i < 9; i++) {
          const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
          const noun = nouns[Math.floor(Math.random() * nouns.length)];
          const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
          const dietOptions = dietsArray[Math.floor(Math.random() * dietsArray.length)];
          const spiceLevel = spices[Math.floor(Math.random() * spices.length)];
          
          let avgBudget = Math.floor(Math.random() * 800) + 200; // 200 to 1000
          let priceRange = avgBudget < 400 ? 'low' : avgBudget < 700 ? 'medium' : 'high';
          let rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5 to 5.0
          
          sampleRestaurants.push({
            name: `${adj} ${noun} ${cuisine !== 'Multi-Cuisine' ? cuisine : ''}`.trim(),
            cuisine,
            priceRange,
            avgBudget,
            dietOptions,
            spiceLevel,
            city,
            area,
            lat: coords.lat + jitter(),
            lng: coords.lng + jitter(),
            rating: parseFloat(rating),
            tags: ['popular', cuisine.toLowerCase()]
          });
          counter++;
        }
      }
    }
    await Restaurant.insertMany(sampleRestaurants);
    res.json({ message: `Seeded ${sampleRestaurants.length} restaurants successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
