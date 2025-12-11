/**
 * Calculate Feed Conversion Ratio (FCR)
 * FCR = Total Feed Consumed (kg) / Total Weight Gained (kg)
 */
export function calculateFCR(totalFeedKg: number, totalWeightKg: number): number {
  if (!totalWeightKg || !isFinite(totalWeightKg) || totalWeightKg <= 0) return 0;
  if (!totalFeedKg || !isFinite(totalFeedKg) || totalFeedKg < 0) return 0;
  const fcr = totalFeedKg / totalWeightKg;
  return isFinite(fcr) ? fcr : 0;
}

/**
 * Calculate mortality rate as percentage
 */
export function calculateMortalityRate(deaths: number, initialQuantity: number): number {
  if (!initialQuantity || initialQuantity <= 0) return 0;
  if (!deaths || deaths < 0) return 0;
  const rate = (deaths / initialQuantity) * 100;
  return isFinite(rate) ? rate : 0;
}

/**
 * Calculate birds alive
 */
export function calculateBirdsAlive(initialQuantity: number, deaths: number, sold: number = 0): number {
  const alive = initialQuantity - deaths - sold;
  return Math.max(0, alive);
}

/**
 * Calculate profit
 */
export function calculateProfit(revenue: number, expenses: number): number {
  return revenue - expenses;
}

/**
 * Calculate cost per bird
 */
export function calculateCostPerBird(totalExpenses: number, birdsProduced: number): number {
  if (!birdsProduced || birdsProduced <= 0) return 0;
  const cost = totalExpenses / birdsProduced;
  return isFinite(cost) ? cost : 0;
}

/**
 * Calculate cost per pound
 */
export function calculateCostPerLb(totalExpenses: number, totalWeightLb: number): number {
  if (!totalWeightLb || totalWeightLb <= 0) return 0;
  const cost = totalExpenses / totalWeightLb;
  return isFinite(cost) ? cost : 0;
}

/**
 * Calculate average weight per bird
 */
export function calculateAvgWeightPerBird(totalWeight: number, birdCount: number): number {
  if (!birdCount || birdCount <= 0) return 0;
  const avg = totalWeight / birdCount;
  return isFinite(avg) ? avg : 0;
}

/**
 * Sum an array of numbers safely
 */
export function safeSum(values: (number | null | undefined)[]): number {
  return values.reduce((sum: number, val) => {
    const num = Number(val);
    return sum + (isFinite(num) ? num : 0);
  }, 0);
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (!oldValue || oldValue === 0) return 0;
  const change = ((newValue - oldValue) / oldValue) * 100;
  return isFinite(change) ? change : 0;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
