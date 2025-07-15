export const formatCurrency = (value: number): string => {
  // All amounts are already in lakhs, so just format them appropriately
  if (value >= 100) {
    return `${(value / 100).toFixed(2)} Cr`;
  } else if (value >= 1) {
    return `${value.toFixed(1)} Lakh`;
  } else {
    return `${(value * 100).toFixed(0)}K`;
  }
};

/**
 * Calculate and format rate per gaj (square yard)
 * @param priceMin - Minimum price in lakhs
 * @param priceMax - Maximum price in lakhs  
 * @param sizeMin - Minimum size in square yards
 * @param sizeMax - Maximum size in square yards
 * @returns Formatted rate per gaj string
 */
export const formatRatePerGaj = (
  priceMin: number,
  priceMax: number,
  sizeMin: number,
  sizeMax: number
): string => {
  // Handle zero or invalid sizes
  if (!sizeMin || sizeMin <= 0) {
    return "Rate not available";
  }

  // Convert lakhs to actual rupees for calculation
  const priceMinRupees = priceMin * 100000;
  const priceMaxRupees = priceMax * 100000;

  // Calculate rate per gaj
  const rateMin = Math.round(priceMinRupees / sizeMin);
  
  // If there's a price range, calculate max rate
  if (priceMax > priceMin && sizeMax > 0) {
    const rateMax = Math.round(priceMaxRupees / sizeMax);
    
    // If rates are different, show range
    if (rateMin !== rateMax) {
      return `₹${formatNumber(rateMin)} - ₹${formatNumber(rateMax)}/gaj`;
    }
  }
  
  // Single rate
  return `₹${formatNumber(rateMin)}/gaj`;
};

/**
 * Format number with Indian number system (lakhs, crores)
 * @param num - Number to format
 * @returns Formatted number string
 */
const formatNumber = (num: number): string => {
  if (num >= 10000000) { // 1 crore
    return `${(num / 10000000).toFixed(1)}Cr`;
  } else if (num >= 100000) { // 1 lakh
    return `${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) { // 1 thousand
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
};