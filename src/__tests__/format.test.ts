import { describe, it, expect } from 'vitest';
import { formatBytes, formatPercentage } from '../utils/format';

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('should handle small byte values', () => {
    expect(formatBytes(500)).toBe('500 Bytes');
    expect(formatBytes(1023)).toBe('1023 Bytes');
  });
});

describe('formatPercentage', () => {
  it('should format percentages correctly', () => {
    expect(formatPercentage(0)).toBe('0.00%');
    expect(formatPercentage(50)).toBe('50.00%');
    expect(formatPercentage(100)).toBe('100.00%');
    expect(formatPercentage(33.333)).toBe('33.33%');
  });

  it('should handle values over 100', () => {
    expect(formatPercentage(150)).toBe('150.00%');
  });

  it('should handle decimal values', () => {
    expect(formatPercentage(0.5)).toBe('0.50%');
    expect(formatPercentage(99.99)).toBe('99.99%');
  });
});