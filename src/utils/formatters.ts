export const formatCurrency = (value: number): string => {
  // All amounts are already in lakhs, so just format them appropriately
  if (value >= 100) {
    return `${(value / 100).toFixed(1)} Cr`;
  } else if (value >= 1) {
    return `${value.toFixed(1)} Lakh`;
  } else {
    return `${(value * 100).toFixed(0)}K`;
  }
};
