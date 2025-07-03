import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  formatNumber, 
  formatDistance,
  formatWeight,
  formatPercentage
} from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency in ARS', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
    });

    it('should handle decimal values', () => {
      expect(formatCurrency(1000.99)).toBe('$1,000.99');
      expect(formatCurrency(1000.5)).toBe('$1,000.50');
    });
  });

  describe('formatDate', () => {
    it('should format date in DD/MM/YYYY format', () => {
      expect(formatDate('2023-12-25')).toBe('25/12/2023');
      expect(formatDate('2023-01-01')).toBe('01/01/2023');
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      expect(formatDate(date)).toBe('25/12/2023');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Fecha inválida');
      expect(formatDate(null)).toBe('Fecha inválida');
      expect(formatDate(undefined)).toBe('Fecha inválida');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime in DD/MM/YYYY HH:MM format', () => {
      expect(formatDateTime('2023-12-25T14:30:00')).toBe('25/12/2023 14:30');
      expect(formatDateTime('2023-01-01T09:00:00')).toBe('01/01/2023 09:00');
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25T14:30:00');
      expect(formatDateTime(date)).toBe('25/12/2023 14:30');
    });

    it('should handle invalid dates', () => {
      expect(formatDateTime('invalid-date')).toBe('Fecha inválida');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle decimal places', () => {
      expect(formatNumber(1000.99, 2)).toBe('1,000.99');
      expect(formatNumber(1000.5, 1)).toBe('1,000.5');
      expect(formatNumber(1000, 0)).toBe('1,000');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
      expect(formatNumber(-1000.99, 2)).toBe('-1,000.99');
    });
  });

  describe('formatDistance', () => {
    it('should format distance in kilometers', () => {
      expect(formatDistance(100)).toBe('100 km');
      expect(formatDistance(1000)).toBe('1,000 km');
      expect(formatDistance(0)).toBe('0 km');
    });

    it('should handle decimal distances', () => {
      expect(formatDistance(100.5)).toBe('100.5 km');
      expect(formatDistance(100.99)).toBe('100.99 km');
    });

    it('should handle null/undefined', () => {
      expect(formatDistance(null)).toBe('- km');
      expect(formatDistance(undefined)).toBe('- km');
    });
  });

  describe('formatWeight', () => {
    it('should format weight in tons', () => {
      expect(formatWeight(1000)).toBe('1 ton');
      expect(formatWeight(2500)).toBe('2.5 ton');
      expect(formatWeight(0)).toBe('0 ton');
    });

    it('should handle kilograms input', () => {
      expect(formatWeight(1500)).toBe('1.5 ton');
      expect(formatWeight(500)).toBe('0.5 ton');
    });

    it('should handle null/undefined', () => {
      expect(formatWeight(null)).toBe('- ton');
      expect(formatWeight(undefined)).toBe('- ton');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage values', () => {
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(0.1)).toBe('10%');
      expect(formatPercentage(1)).toBe('100%');
    });

    it('should handle decimal precision', () => {
      expect(formatPercentage(0.1234, 2)).toBe('12.34%');
      expect(formatPercentage(0.1234, 0)).toBe('12%');
    });

    it('should handle values over 100%', () => {
      expect(formatPercentage(1.5)).toBe('150%');
      expect(formatPercentage(2)).toBe('200%');
    });

    it('should handle negative values', () => {
      expect(formatPercentage(-0.1)).toBe('-10%');
    });
  });
});