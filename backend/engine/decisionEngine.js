/**
 * FairBite - Core Decision Engine (Non-AI)
 * Handles conflict detection, scoring, fairness adjustments, and compromise generation.
 */

// ─── NORMALIZATION HELPERS ─────────────────────────────────────────────────

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

/**
 * Normalize a budget preference to a [0,1] score against a restaurant's price range.
 */
function normalizeBudget(userBudget, restaurantAvgBudget) {
  const ratio = userBudget / restaurantAvgBudget;
  if (ratio >= 1.5) return 1.0;       // well within budget
  if (ratio >= 1.0) return 0.85;      // fits
  if (ratio >= 0.75) return 0.55;     // slightly over
  if (ratio >= 0.5) return 0.25;      // significantly over
  return 0.0;                          // too expensive
}

/**
 * Normalize cuisine preference match.
 * Returns 1.0 if exact match, 0.5 for "any", 0.0 for mismatch.
 */
function normalizeCuisine(userCuisine, restaurantCuisine) {
  if (userCuisine === 'any') return 0.7;
  if (userCuisine.toLowerCase() === restaurantCuisine.toLowerCase()) return 1.0;
  return 0.0;
}

/**
 * Normalize diet compatibility.
 */
function normalizeDiet(userDiet, restaurantDietOptions) {
  if (userDiet === 'any') return 0.8;
  if (restaurantDietOptions.includes(userDiet)) return 1.0;
  // vegan can eat veg; non-veg has no restriction
  if (userDiet === 'vegan' && restaurantDietOptions.includes('veg')) return 0.4;
  return 0.0;
}

/**
 * Normalize spice preference.
 */
function normalizeSpice(userSpice, restaurantSpice) {
  const levels = { mild: 1, medium: 2, spicy: 3 };
  if (userSpice === 'any') return 0.8;
  const diff = Math.abs(levels[userSpice] - levels[restaurantSpice]);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.5;
  return 0.1;
}

/**
 * Normalize distance tolerance.
 */
function normalizeDistance(userMaxDistance, restaurantDistance) {
  if (restaurantDistance <= userMaxDistance * 0.5) return 1.0;
  if (restaurantDistance <= userMaxDistance) return 0.8;
  if (restaurantDistance <= userMaxDistance * 2.0) return 0.2;
  return -5.0; // Heavy penalty for being way out of range
}

// ─── CONFLICT DETECTION ────────────────────────────────────────────────────

/**
 * Compute the conflict intensity among users.
 * Returns intensity: 'low' | 'medium' | 'high', plus conflict details.
 */
function detectConflicts(users) {
  const conflicts = [];

  // Budget conflict
  const budgets = users.map(u => u.budget).filter(Boolean);
  const maxBudget = Math.max(...budgets);
  const minBudget = Math.min(...budgets);
  const budgetRatio = maxBudget / (minBudget || 1);
  if (budgetRatio > 3) conflicts.push({ type: 'budget', severity: 'high', detail: `Budget gap: ₹${minBudget} vs ₹${maxBudget}` });
  else if (budgetRatio > 1.8) conflicts.push({ type: 'budget', severity: 'medium', detail: `Moderate budget difference` });

  // Cuisine conflict
  const cuisines = users.map(u => u.cuisinePreference).filter(c => c && c !== 'any');
  const uniqueCuisines = [...new Set(cuisines.map(c => c.toLowerCase()))];
  if (uniqueCuisines.length > 2) conflicts.push({ type: 'cuisine', severity: 'high', detail: `Multiple cuisines: ${uniqueCuisines.join(', ')}` });
  else if (uniqueCuisines.length === 2) conflicts.push({ type: 'cuisine', severity: 'medium', detail: `Cuisine mismatch: ${uniqueCuisines.join(' vs ')}` });

  // Diet conflict
  const diets = users.map(u => u.diet).filter(d => d && d !== 'any');
  const hasVegan = diets.includes('vegan');
  const hasNonVeg = diets.includes('non-veg');
  if (hasVegan && hasNonVeg) conflicts.push({ type: 'diet', severity: 'high', detail: 'Vegan and non-veg preferences' });

  // Distance conflict
  const distances = users.map(u => u.maxDistance).filter(Boolean);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  if (maxDistance / (minDistance || 1) > 3) conflicts.push({ type: 'distance', severity: 'medium', detail: `Distance range: ${minDistance}km–${maxDistance}km` });

  // City conflict
  const cityList = [...new Set(users.map(u => u.city).filter(Boolean))];
  if (cityList.length > 1) {
    conflicts.push({ type: 'location', severity: 'high', detail: `Users in different cities: ${cityList.join(' & ')}` });
  }

  const severityScore = conflicts.reduce((sum, c) => sum + (c.severity === 'high' ? 3 : c.severity === 'medium' ? 2 : 1), 0);
  const intensity = severityScore >= 5 ? 'high' : severityScore >= 2 ? 'medium' : 'low';

  return { intensity, conflicts, severityScore };
}

// ─── SCORING ENGINE ────────────────────────────────────────────────────────

/**
 * Score a single restaurant for a single user.
 * Returns raw score [0, 100].
 */
function scoreRestaurantForUser(user, restaurant) {
  const budgetScore = normalizeBudget(user.budget || 300, restaurant.avgBudget);
  const cuisineScore = normalizeCuisine(user.cuisinePreference || 'any', restaurant.cuisine);
  const dietScore = normalizeDiet(user.diet || 'any', restaurant.dietOptions);
  const spiceScore = normalizeSpice(user.spiceLevel || 'any', restaurant.spiceLevel);
  // Calculate real distance using coordinates
  const actualDistance = getDistanceFromLatLonInKm(user.lat, user.lng, restaurant.lat, restaurant.lng);
  const distanceScore = normalizeDistance(user.maxDistance || 10, actualDistance);

  // User-defined weights (1–5 scale, normalized to sum to 1)
  const weights = {
    budget: user.weights?.budget || 3,
    cuisine: user.weights?.cuisine || 3,
    diet: user.weights?.diet || 3,
    spice: user.weights?.spice || 2,
    distance: user.weights?.distance || 2,
  };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  let weightedScore =
    (budgetScore * weights.budget +
      cuisineScore * weights.cuisine +
      dietScore * weights.diet +
      spiceScore * weights.spice +
      distanceScore * weights.distance) /
    totalWeight;

  // Cross-city penalty: If restaurant is in a different city than the user, slap a massive penalty
  if (user.city && restaurant.city && user.city !== restaurant.city) {
    weightedScore -= 2.0; // Massive drop
  }

  return {
    raw: Math.round(Math.max(0, weightedScore * 100)),
    breakdown: {
      budget: Math.round(budgetScore * 100),
      cuisine: Math.round(cuisineScore * 100),
      diet: Math.round(dietScore * 100),
      spice: Math.round(spiceScore * 100),
      distance: Math.round(distanceScore * 100),
    },
  };
}

/**
 * Apply fairness penalty to prevent one user always dominating.
 * If history shows someone always wins, boost others.
 */
function applyFairnessPenalty(userScores, history) {
  if (!history || history.length === 0) return userScores;

  // Count how many times each user was "satisfied" (score > 70) in history
  const satisfactionCounts = {};
  for (const session of history) {
    for (const [userId, score] of Object.entries(session)) {
      satisfactionCounts[userId] = (satisfactionCounts[userId] || 0) + (score > 70 ? 1 : 0);
    }
  }

  const maxCount = Math.max(...Object.values(satisfactionCounts));
  const adjusted = {};
  for (const [userId, score] of Object.entries(userScores)) {
    const penalty = ((satisfactionCounts[userId] || 0) / (maxCount || 1)) * 10;
    const boost = (1 - (satisfactionCounts[userId] || 0) / (maxCount || 1)) * 10;
    adjusted[userId] = Math.min(100, Math.max(0, score - penalty + boost));
  }
  return adjusted;
}

/**
 * Compute fairness index among users' satisfaction scores.
 * Uses Jain's Fairness Index.
 */
function computeFairnessIndex(scores) {
  const vals = Object.values(scores);
  if (vals.length === 0) return 100;
  const n = vals.length;
  const sumSq = vals.reduce((a, b) => a + b * b, 0);
  const sum = vals.reduce((a, b) => a + b, 0);
  const jain = (sum * sum) / (n * sumSq);
  return Math.round(jain * 100);
}

// ─── EXPLANATION ENGINE ────────────────────────────────────────────────────

function generateExplanation(restaurant, userScores, conflictResult, mode) {
  const lines = [];
  const sortedScores = Object.entries(userScores).sort((a, b) => b[1] - a[1]);
  const avgScore = Math.round(sortedScores.reduce((s, [, v]) => s + v, 0) / sortedScores.length);

  lines.push(`Selected "${restaurant.name}" with an average satisfaction score of ${avgScore}/100.`);

  if (mode === 'democracy') {
    lines.push('Decision mode: Democracy — all users have equal weight.');
  } else {
    lines.push('Decision mode: Priority — users with higher weights have more influence.');
  }

  if (conflictResult.intensity === 'high') {
    lines.push(`⚠️ HIGH conflict detected. A compromise restaurant was chosen to balance conflicting needs.`);
  } else if (conflictResult.intensity === 'medium') {
    lines.push(`🔶 MEDIUM conflict found. Best balanced option selected.`);
  } else {
    lines.push(`✅ LOW conflict. Strong group consensus found.`);
  }

  for (const { type, detail } of conflictResult.conflicts) {
    lines.push(`Conflict (${type}): ${detail}`);
  }

  if (restaurant.dietOptions.includes('veg') && restaurant.dietOptions.includes('non-veg')) {
    lines.push('✅ Multi-diet menu accommodates both veg and non-veg preferences.');
  }
  if (restaurant.cuisine === 'Multi-Cuisine') {
    lines.push('✅ Multi-cuisine menu helps bridge diverging cuisine preferences.');
  }

  return lines;
}

// ─── COMPROMISE GENERATOR ──────────────────────────────────────────────────

function generateCompromiseSuggestions(conflictResult) {
  const tips = [];
  if (conflictResult.intensity === 'high') {
    tips.push('Consider splitting into two groups with a shared table at a multi-cuisine venue.');
    tips.push('Rotate the decision-maker next time so everyone gets their turn.');
    tips.push('Try a buffet restaurant where everyone can pick their own food.');
  } else if (conflictResult.intensity === 'medium') {
    tips.push('A restaurant with a diverse menu can satisfy most preferences.');
    tips.push('Consider ordering from multiple sections of the menu.');
  } else {
    tips.push('Your group has great alignment — any top-rated option works!');
  }
  return tips;
}

// ─── LOGISTICS ENGINE ────────────────────────────────────────────────────────

function generateLogistics(users, restaurant) {
  const plans = {};
  for(const u of users) {
    const dist = getDistanceFromLatLonInKm(u.lat, u.lng, restaurant.lat, restaurant.lng);
    let mode, price, time;
    
    if (dist <= 1.5) {
      mode = '🛺 Auto / Walk';
      price = `₹${Math.round(dist * 15 + 25)}`;
      time = `${Math.max(5, Math.round(dist * 10))} mins`;
    } else if (dist <= 6) {
      mode = '🚕 Cab / Auto';
      price = `₹${Math.round(dist * 16 + 40)}`;
      time = `${Math.round(dist * 6)} mins`;
    } else if (dist <= 15) {
      mode = '🚇 Metro + Walk';
      price = `₹${Math.round(dist * 2.5 + 20)}`;
      time = `${Math.round(dist * 4 + 10)} mins`;
    } else {
      mode = '🚌 Bus / 🚕 Cab';
      price = `₹${Math.round(dist * 16 + 50)} (Cab) | ₹${Math.round(dist * 2 + 15)} (Bus)`;
      time = `${Math.round(dist * 4)} mins (Cab)`;
    }
    
    plans[u.id] = { distance: dist.toFixed(1), mode, price, time };
  }
  return plans;
}

// ─── MAIN DECISION FUNCTION ────────────────────────────────────────────────

/**
 * Main entry point for the FairBite decision engine.
 * 
 * @param {Array} users - Array of user preference objects
 * @param {Array} restaurants - Array of restaurant objects from DB
 * @param {string} mode - 'democracy' | 'priority'
 * @param {Array} history - Optional array of past session score maps
 * @returns {Object} Decision result
 */
function resolveConflict({ users, restaurants, mode = 'democracy', history = [] }) {
  // Edge case: no users
  if (!users || users.length === 0) {
    return { error: 'No users provided. Please add at least one user.' };
  }

  // Edge case: no restaurants
  if (!restaurants || restaurants.length === 0) {
    return { error: 'No restaurants available. Check the database.' };
  }

  // Fill in missing fields with defaults
  const filledUsers = users.map((u, i) => ({
    id: u.id || `user_${i + 1}`,
    name: u.name || `User ${i + 1}`,
    budget: u.budget || 300,
    cuisinePreference: u.cuisinePreference || 'any',
    diet: u.diet || 'any',
    spiceLevel: u.spiceLevel || 'any',
    maxDistance: u.maxDistance || 10,
    lat: u.lat,
    lng: u.lng,
    city: u.city,
    area: u.area,
    weights: u.weights || { budget: 3, cuisine: 3, diet: 3, spice: 2, distance: 2 },
    globalWeight: mode === 'priority' ? (u.globalWeight || 1) : 1,
  }));

  // Detect conflicts
  const conflictResult = detectConflicts(filledUsers);

  // Score each restaurant for each user
  const restaurantResults = restaurants.map(restaurant => {
    const userScoresRaw = {};
    const userBreakdowns = {};

    for (const user of filledUsers) {
      const { raw, breakdown } = scoreRestaurantForUser(user, restaurant);
      userScoresRaw[user.id] = raw;
      userBreakdowns[user.id] = breakdown;
    }

    // Apply fairness penalty
    const fairnessAdjusted = applyFairnessPenalty(userScoresRaw, history);

    // Aggregate: weighted average by globalWeight
    const totalGlobalWeight = filledUsers.reduce((s, u) => s + u.globalWeight, 0);
    const aggregateScore =
      filledUsers.reduce((s, u) => s + fairnessAdjusted[u.id] * u.globalWeight, 0) /
      totalGlobalWeight;

    const fairnessIndex = computeFairnessIndex(fairnessAdjusted);

    return {
      restaurant,
      userScores: fairnessAdjusted,
      userBreakdowns,
      aggregateScore: Math.round(aggregateScore),
      fairnessIndex,
    };
  });

  // Sort by aggregate score descending
  restaurantResults.sort((a, b) => b.aggregateScore - a.aggregateScore);

  // Handle no matching option
  const noMatch = restaurantResults.every(r => r.aggregateScore < 20);

  const top = restaurantResults[0];
  const alternatives = restaurantResults.slice(1, 4);

  const explanation = generateExplanation(
    top.restaurant,
    top.userScores,
    conflictResult,
    mode
  );

  const compromiseSuggestions = generateCompromiseSuggestions(conflictResult);

  return {
    success: true,
    noMatch,
    noMatchMessage: noMatch ? 'No perfect match found — best compromise shown below.' : null,
    conflict: conflictResult,
    selected: {
      restaurant: top.restaurant,
      aggregateScore: top.aggregateScore,
      fairnessIndex: top.fairnessIndex,
      userScores: top.userScores,
      userBreakdowns: top.userBreakdowns,
      explanation,
      logistics: generateLogistics(filledUsers, top.restaurant),
    },
    alternatives: alternatives.map(a => ({
      restaurant: a.restaurant,
      aggregateScore: a.aggregateScore,
      fairnessIndex: a.fairnessIndex,
      userScores: a.userScores,
    })),
    compromiseSuggestions,
    users: filledUsers,
    mode,
  };
}

module.exports = { resolveConflict };
