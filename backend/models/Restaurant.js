const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuisine: { type: String, required: true },
  priceRange: { type: String, enum: ['low', 'medium', 'high'], required: true },
  avgBudget: { type: Number, required: true }, // in ₹
  dietOptions: [{ type: String, enum: ['veg', 'non-veg', 'vegan'] }],
  spiceLevel: { type: String, enum: ['mild', 'medium', 'spicy'], required: true },
  city: { type: String, required: true },
  area: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  distance: { type: Number, default: 0 }, // optional fallback
  rating: { type: Number, min: 0, max: 5, default: 4.0 },
  image: { type: String, default: '' },
  tags: [String],
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
