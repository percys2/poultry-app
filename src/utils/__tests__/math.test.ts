import {
  calculateFCR,
  calculateMortalityRate,
  calculateBirdsAlive,
  calculateProfit,
  calculateCostPerBird,
  calculateCostPerLb,
  calculateAvgWeightPerBird,
  safeSum,
  calculatePercentageChange,
  clamp,
} from '../math';

describe('math utilities', () => {
  describe('calculateFCR', () => {
    it('calculates FCR correctly', () => {
      expect(calculateFCR(100, 50)).toBe(2);
      expect(calculateFCR(150, 100)).toBe(1.5);
    });

    it('handles edge cases', () => {
      expect(calculateFCR(0, 50)).toBe(0);
      expect(calculateFCR(100, 0)).toBe(0);
      expect(calculateFCR(NaN, 50)).toBe(0);
      expect(calculateFCR(100, NaN)).toBe(0);
    });
  });

  describe('calculateMortalityRate', () => {
    it('calculates mortality rate correctly', () => {
      expect(calculateMortalityRate(10, 100)).toBe(10);
      expect(calculateMortalityRate(25, 500)).toBe(5);
    });

    it('handles edge cases', () => {
      expect(calculateMortalityRate(0, 100)).toBe(0);
      expect(calculateMortalityRate(10, 0)).toBe(0);
      expect(calculateMortalityRate(-5, 100)).toBe(0);
    });
  });

  describe('calculateBirdsAlive', () => {
    it('calculates birds alive correctly', () => {
      expect(calculateBirdsAlive(500, 10, 50)).toBe(440);
      expect(calculateBirdsAlive(500, 10)).toBe(490);
    });

    it('returns 0 when result would be negative', () => {
      expect(calculateBirdsAlive(100, 150, 0)).toBe(0);
    });
  });

  describe('calculateProfit', () => {
    it('calculates profit correctly', () => {
      expect(calculateProfit(1000, 600)).toBe(400);
      expect(calculateProfit(500, 800)).toBe(-300);
    });
  });

  describe('calculateCostPerBird', () => {
    it('calculates cost per bird correctly', () => {
      expect(calculateCostPerBird(1000, 100)).toBe(10);
      expect(calculateCostPerBird(500, 50)).toBe(10);
    });

    it('handles edge cases', () => {
      expect(calculateCostPerBird(1000, 0)).toBe(0);
      expect(calculateCostPerBird(1000, -10)).toBe(0);
    });
  });

  describe('calculateCostPerLb', () => {
    it('calculates cost per lb correctly', () => {
      expect(calculateCostPerLb(1000, 100)).toBe(10);
      expect(calculateCostPerLb(500, 50)).toBe(10);
    });

    it('handles edge cases', () => {
      expect(calculateCostPerLb(1000, 0)).toBe(0);
      expect(calculateCostPerLb(1000, -10)).toBe(0);
    });
  });

  describe('calculateAvgWeightPerBird', () => {
    it('calculates average weight per bird correctly', () => {
      expect(calculateAvgWeightPerBird(500, 100)).toBe(5);
      expect(calculateAvgWeightPerBird(250, 50)).toBe(5);
    });

    it('handles edge cases', () => {
      expect(calculateAvgWeightPerBird(500, 0)).toBe(0);
      expect(calculateAvgWeightPerBird(500, -10)).toBe(0);
    });
  });

  describe('safeSum', () => {
    it('sums array of numbers correctly', () => {
      expect(safeSum([1, 2, 3, 4, 5])).toBe(15);
      expect(safeSum([10, 20, 30])).toBe(60);
    });

    it('handles null and undefined values', () => {
      expect(safeSum([1, null, 3, undefined, 5])).toBe(9);
      expect(safeSum([null, undefined])).toBe(0);
    });

    it('handles empty array', () => {
      expect(safeSum([])).toBe(0);
    });
  });

  describe('calculatePercentageChange', () => {
    it('calculates percentage change correctly', () => {
      expect(calculatePercentageChange(100, 150)).toBe(50);
      expect(calculatePercentageChange(100, 50)).toBe(-50);
    });

    it('handles edge cases', () => {
      expect(calculatePercentageChange(0, 100)).toBe(0);
    });
  });

  describe('clamp', () => {
    it('clamps values correctly', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
