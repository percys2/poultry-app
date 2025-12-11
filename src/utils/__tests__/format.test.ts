import {
  kgToLb,
  lbToKg,
  formatCurrency,
  formatUSD,
  formatNumber,
  formatPercentage,
  formatWeightLb,
  formatWeightKg,
  KG_TO_LB,
  LB_TO_KG,
} from '../format';

describe('format utilities', () => {
  describe('kgToLb', () => {
    it('converts kilograms to pounds correctly', () => {
      expect(kgToLb(1)).toBeCloseTo(2.20462, 4);
      expect(kgToLb(10)).toBeCloseTo(22.0462, 4);
      expect(kgToLb(0)).toBe(0);
    });

    it('handles invalid inputs', () => {
      expect(kgToLb(-1)).toBe(0);
      expect(kgToLb(NaN)).toBe(0);
      expect(kgToLb(Infinity)).toBe(0);
    });
  });

  describe('lbToKg', () => {
    it('converts pounds to kilograms correctly', () => {
      expect(lbToKg(1)).toBeCloseTo(0.453592, 4);
      expect(lbToKg(10)).toBeCloseTo(4.53592, 4);
      expect(lbToKg(0)).toBe(0);
    });

    it('handles invalid inputs', () => {
      expect(lbToKg(-1)).toBe(0);
      expect(lbToKg(NaN)).toBe(0);
      expect(lbToKg(Infinity)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with default C$ symbol', () => {
      const result = formatCurrency(1000);
      expect(result.startsWith('C$')).toBe(true);
      expect(result).toMatch(/C\$1[.,]?000/);
      expect(formatCurrency(0)).toBe('C$0');
    });

    it('formats currency with custom symbol', () => {
      const result = formatCurrency(1000, '$');
      expect(result.startsWith('$')).toBe(true);
      expect(result).toMatch(/\$1[.,]?000/);
    });

    it('handles invalid inputs', () => {
      expect(formatCurrency(NaN)).toBe('C$0');
      expect(formatCurrency(Infinity)).toBe('C$0');
    });
  });

  describe('formatUSD', () => {
    it('formats USD correctly', () => {
      expect(formatUSD(1000)).toBe('$1,000.00');
      expect(formatUSD(0)).toBe('$0.00');
      expect(formatUSD(99.99)).toBe('$99.99');
    });

    it('handles invalid inputs', () => {
      expect(formatUSD(NaN)).toBe('$0');
      expect(formatUSD(Infinity)).toBe('$0');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with specified decimals', () => {
      expect(formatNumber(123.456, 2)).toBe('123.46');
      expect(formatNumber(123.456, 0)).toBe('123');
      expect(formatNumber(123.456)).toBe('123');
    });

    it('handles invalid inputs', () => {
      expect(formatNumber(NaN)).toBe('0');
      expect(formatNumber(Infinity)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentages correctly', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(33.333, 2)).toBe('33.33%');
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('handles invalid inputs', () => {
      expect(formatPercentage(NaN)).toBe('0%');
      expect(formatPercentage(Infinity)).toBe('0%');
    });
  });

  describe('formatWeightLb', () => {
    it('formats weight in pounds from kg', () => {
      expect(formatWeightLb(1)).toBe('2.2 lb');
      expect(formatWeightLb(10, 2)).toBe('22.05 lb');
    });
  });

  describe('formatWeightKg', () => {
    it('formats weight in kilograms', () => {
      expect(formatWeightKg(1)).toBe('1.0 kg');
      expect(formatWeightKg(10.5, 2)).toBe('10.50 kg');
    });

    it('handles invalid inputs', () => {
      expect(formatWeightKg(NaN)).toBe('0 kg');
      expect(formatWeightKg(Infinity)).toBe('0 kg');
    });
  });

  describe('constants', () => {
    it('has correct conversion constants', () => {
      expect(KG_TO_LB).toBeCloseTo(2.20462, 4);
      expect(LB_TO_KG).toBeCloseTo(0.453592, 4);
    });
  });
});
