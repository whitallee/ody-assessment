/**
 * @jest-environment node
 */

// Pure utility tests — no React Native imports so no polyfill/transform issues.
// Component rendering tests require a proper RN test environment; these cover
// the shared business logic that underpins the UI.

import { formatCurrency, formatDate, initials, truncate, pluralize } from '@ody/shared';

describe('formatCurrency', () => {
  it('formats cents as USD', () => {
    expect(formatCurrency(1000)).toBe('$10.00');
    expect(formatCurrency(2850)).toBe('$28.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large amounts correctly', () => {
    expect(formatCurrency(100000)).toBe('$1,000.00');
  });
});

describe('initials', () => {
  it('returns first letter of each word (up to 2)', () => {
    expect(initials('Jane Doe')).toBe('JD');
    expect(initials('Alice')).toBe('A');
    expect(initials('John Paul Smith')).toBe('JP');
  });

  it('uppercases letters', () => {
    expect(initials('alice bob')).toBe('AB');
  });
});

describe('truncate', () => {
  it('returns the string unchanged when within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    const result = truncate('hello world', 8);
    expect(result.length).toBeLessThanOrEqual(8);
    expect(result).toContain('…');
  });
});

describe('pluralize', () => {
  it('returns singular for count 1', () => {
    expect(pluralize(1, 'order')).toBe('order');
  });

  it('returns plural for count !== 1', () => {
    expect(pluralize(0, 'order')).toBe('orders');
    expect(pluralize(5, 'order')).toBe('orders');
  });

  it('supports custom plural form', () => {
    expect(pluralize(2, 'box', 'boxes')).toBe('boxes');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
