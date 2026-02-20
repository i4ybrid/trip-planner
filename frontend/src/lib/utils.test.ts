import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatDateRange,
  formatCurrency,
  getInitials,
  getStatusColor,
  getRelativeTime,
  truncate,
  generateShareUrl,
  generateWhatsAppShareUrl,
  generateTelegramShareUrl,
  generateEmailShareUrl,
} from '../lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const result = formatDate('2026-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });

  it('should return TBD for undefined', () => {
    expect(formatDate(undefined)).toBe('TBD');
  });
});

describe('formatDateRange', () => {
  it('should format same-month range', () => {
    const result = formatDateRange('2026-06-01', '2026-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('1');
    expect(result).toContain('15');
  });

  it('should return single date for start only', () => {
    const result = formatDateRange('2026-06-01', undefined);
    expect(result).toContain('Jun');
    expect(result).toContain('1');
  });

  it('should return TBD for no start date', () => {
    expect(formatDateRange(undefined, '2026-06-15')).toBe('TBD');
  });
});

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
  });

  it('should return Free for zero', () => {
    expect(formatCurrency(0)).toBe('Free');
  });

  it('should return Free for undefined', () => {
    expect(formatCurrency(undefined)).toBe('Free');
  });
});

describe('getInitials', () => {
  it('should return initials from name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('should handle single name', () => {
    expect(getInitials('John')).toBe('JO');
  });

  it('should limit to 2 characters', () => {
    expect(getInitials('John Doe Smith')).toBe('JD');
  });
});

describe('getStatusColor', () => {
  it('should return correct colors for statuses', () => {
    expect(getStatusColor('IDEA')).toContain('gray');
    expect(getStatusColor('PLANNING')).toContain('blue');
    expect(getStatusColor('CONFIRMED')).toContain('green');
    expect(getStatusColor('IN_PROGRESS')).toContain('purple');
    expect(getStatusColor('COMPLETED')).toContain('gray');
    expect(getStatusColor('CANCELLED')).toContain('red');
  });
});

describe('truncate', () => {
  it('should truncate long strings', () => {
    const result = truncate('Hello World', 5);
    expect(result).toBe('Hello...');
  });

  it('should not truncate short strings', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });
});

describe('generateShareUrl', () => {
  it('should generate share URL', () => {
    const result = generateShareUrl('abc123');
    expect(result).toContain('abc123');
  });
});

describe('generateWhatsAppShareUrl', () => {
  it('should encode message for WhatsApp', () => {
    const result = generateWhatsAppShareUrl('Hello World');
    expect(result).toContain('wa.me');
    expect(result).toContain('Hello%20World');
  });
});

describe('generateTelegramShareUrl', () => {
  it('should encode message for Telegram', () => {
    const result = generateTelegramShareUrl('Hello World');
    expect(result).toContain('t.me');
    expect(result).toContain('Hello%20World');
  });
});

describe('generateEmailShareUrl', () => {
  it('should generate mailto link', () => {
    const result = generateEmailShareUrl('test@example.com', 'Subject', 'Body');
    expect(result).toContain('mailto:');
    expect(result).toContain('test@example.com');
    expect(result).toContain('Subject');
    expect(result).toContain('Body');
  });
});
