import { describe, expect, it } from 'vitest';

import { PAGOS360_CHANNELS, formatDueDate } from '../src/index.js';
import { mapCreatePaymentRequestInput } from '../src/mappers/index.js';

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

describe('mapCreatePaymentRequestInput', () => {
	const baseInput = {
		payerName: 'Juan Perez',
		description: 'Pago de prueba',
		firstTotal: 100,
		firstDueDate: '27-01-2026'
	};

	it('maps excludedChannels to excluded_channels', () => {
		const body = mapCreatePaymentRequestInput({
			...baseInput,
			excludedChannels: [PAGOS360_CHANNELS.creditCard, PAGOS360_CHANNELS.nonBanking]
		});

		expect(body).toEqual({
			payment_request: {
				payer_name: 'Juan Perez',
				description: 'Pago de prueba',
				first_total: 100,
				first_due_date: '27-01-2026',
				excluded_channels: ['credit_card', 'non_banking']
			}
		});
	});

	it('omits excluded_channels when not provided or empty', () => {
		expect(mapCreatePaymentRequestInput(baseInput)).toEqual({
			payment_request: {
				payer_name: 'Juan Perez',
				description: 'Pago de prueba',
				first_total: 100,
				first_due_date: '27-01-2026'
			}
		});
		expect(
			mapCreatePaymentRequestInput({ ...baseInput, excludedChannels: [] })
		).toEqual({
			payment_request: {
				payer_name: 'Juan Perez',
				description: 'Pago de prueba',
				first_total: 100,
				first_due_date: '27-01-2026'
			}
		});
	});
});
