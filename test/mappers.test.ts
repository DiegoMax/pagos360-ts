import { describe, expect, it } from 'vitest';

import { formatDueDate } from '../src/index.js';

describe('formatDueDate', () => {
	it('formats a Date as DD-MM-YYYY (UTC)', () => {
		expect(formatDueDate(new Date(Date.UTC(2026, 0, 27)))).toBe('27-01-2026');
		expect(formatDueDate(new Date(Date.UTC(2026, 11, 5)))).toBe('05-12-2026');
	});

	it('passes through DD-MM-YYYY strings unchanged', () => {
		expect(formatDueDate('27-01-2026')).toBe('27-01-2026');
	});

	it('converts ISO date strings to DD-MM-YYYY', () => {
		expect(formatDueDate('2026-01-27')).toBe('27-01-2026');
		expect(formatDueDate('2026-01-27T03:00:00Z')).toBe('27-01-2026');
	});

	it('returns the raw string when it cannot parse', () => {
		expect(formatDueDate('not-a-date')).toBe('not-a-date');
	});
});
