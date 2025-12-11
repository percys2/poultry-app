// Unit conversion constants
export const KG_TO_LB = 2.20462;
export const LB_TO_KG = 0.453592;

/**
 * Convert kilograms to pounds
 */
export function kgToLb(kg: number): number {
  if (!isFinite(kg) || kg < 0) return 0;
  return kg * KG_TO_LB;
}

/**
 * Convert pounds to kilograms
 */
export function lbToKg(lb: number): number {
  if (!isFinite(lb) || lb < 0) return 0;
  return lb * LB_TO_KG;
}

/**
 * Format currency in Nicaraguan Cordobas
 */
export function formatCurrency(value: number, currency: string = 'C$'): string {
  if (!isFinite(value)) return `${currency}0`;
  return `${currency}${Number(value).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format currency in USD
 */
export function formatUSD(value: number): string {
  if (!isFinite(value)) return '$0';
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (!isFinite(value)) return '0';
  return value.toFixed(decimals);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format weight in pounds
 */
export function formatWeightLb(kg: number, decimals: number = 1): string {
  const lb = kgToLb(kg);
  return `${lb.toFixed(decimals)} lb`;
}

/**
 * Format weight in kilograms
 */
export function formatWeightKg(kg: number, decimals: number = 1): string {
  if (!isFinite(kg)) return '0 kg';
  return `${kg.toFixed(decimals)} kg`;
}
