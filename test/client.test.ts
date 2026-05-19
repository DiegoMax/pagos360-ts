import { describe, expect, it, vi } from 'vitest';

import {
	createPagos360Client,
	Pagos360HttpError,
	Pagos360ResponseValidationError,
	Pagos360ValidationError
} from '../src/index.js';

type FetchMock = ReturnType<typeof vi.fn> & {
	mockResolvedValueOnce: (value: Response) => FetchMock;
};

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

function buildPaymentRequestWire(overrides: Record<string, unknown> = {}) {
	return {
		id: 135,
		type: 'payment_request',
		state: 'pending',
		created_at: '2026-01-01T15:20:49-03:00',
		payer_name: 'Diego',
		description: 'Pago facturas 123',
		first_due_date: '2026-01-27T00:00:00-03:00',
		first_total: 1167.34,
		external_reference: 'REF-1',
		checkout_url: 'https://checkout.pagos360.com/payment-request/abc',
		request_result_id: null,
		paid_at: null,
		...overrides
	};
}

describe('createPagos360Client', () => {
	it('throws when apiKey is missing', () => {
		expect(() =>
			createPagos360Client({ environment: 'sandbox', apiKey: '   ' })
		).toThrow(Pagos360ValidationError);
	});

	it('createPaymentRequest sends snake_case body with Bearer auth and maps the response', async () => {
		const fetchMock = vi.fn() as FetchMock;
		fetchMock.mockResolvedValueOnce(jsonResponse(200, buildPaymentRequestWire()));

		const client = createPagos360Client({
			environment: 'sandbox',
			apiKey: 'sk_test_123',
			fetch: fetchMock as unknown as typeof fetch
		});

		const result = await client.createPaymentRequest({
			payerName: 'Diego',
			description: 'Pago facturas 123',
			firstTotal: 1167.34,
			firstDueDate: new Date(Date.UTC(2026, 0, 27)),
			externalReference: 'REF-1',
			backUrlSuccess: 'https://example.com/ok',
			backUrlPending: 'https://example.com/pending',
			backUrlRejected: 'https://example.com/rej'
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('https://api.sandbox.pagos360.com/payment-request');
		expect(init.method).toBe('POST');
		const headers = init.headers as Record<string, string>;
		expect(headers.authorization).toBe('Bearer sk_test_123');
		expect(headers['content-type']).toBe('application/json');
		const body = JSON.parse(init.body as string);
		expect(body).toEqual({
			payment_request: {
				payer_name: 'Diego',
				description: 'Pago facturas 123',
				first_total: 1167.34,
				first_due_date: '27-01-2026',
				external_reference: 'REF-1',
				back_url_success: 'https://example.com/ok',
				back_url_pending: 'https://example.com/pending',
				back_url_rejected: 'https://example.com/rej'
			}
		});

		expect(result.id).toBe(135);
		expect(result.state).toBe('pending');
		expect(result.checkoutUrl).toBe('https://checkout.pagos360.com/payment-request/abc');
		expect(result.externalReference).toBe('REF-1');
		expect(result.raw.id).toBe(135);
	});

	it('createPaymentRequest validates input', async () => {
		const client = createPagos360Client({
			environment: 'sandbox',
			apiKey: 'sk_test_123',
			fetch: vi.fn() as unknown as typeof fetch
		});

		await expect(
			client.createPaymentRequest({
				payerName: '',
				description: 'x',
				firstTotal: 10,
				firstDueDate: new Date()
			})
		).rejects.toBeInstanceOf(Pagos360ValidationError);
	});

	it('getPaymentRequest GETs the resource and maps the response', async () => {
		const fetchMock = vi.fn() as FetchMock;
		fetchMock.mockResolvedValueOnce(
			jsonResponse(
				200,
				buildPaymentRequestWire({
					state: 'paid',
					request_result_id: 9876,
					paid_at: '2026-01-28T10:00:00-03:00'
				})
			)
		);

		const client = createPagos360Client({
			environment: 'production',
			apiKey: 'sk_live_xyz',
			fetch: fetchMock as unknown as typeof fetch
		});

		const result = await client.getPaymentRequest(135);

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('https://api.pagos360.com/payment-request/135');
		expect(init.method).toBe('GET');
		expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk_live_xyz');
		expect(result.state).toBe('paid');
		expect(result.requestResultId).toBe('9876');
		expect(result.paidAt).toBe('2026-01-28T10:00:00-03:00');
	});

	it('wraps non-2xx responses in Pagos360HttpError', async () => {
		const fetchMock = vi.fn() as FetchMock;
		fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'unauthorized' }));

		const client = createPagos360Client({
			environment: 'sandbox',
			apiKey: 'sk_test_123',
			fetch: fetchMock as unknown as typeof fetch
		});

		await expect(client.getPaymentRequest(135)).rejects.toBeInstanceOf(Pagos360HttpError);
	});

	it('throws Pagos360ResponseValidationError when payload misses required fields', async () => {
		const fetchMock = vi.fn() as FetchMock;
		fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

		const client = createPagos360Client({
			environment: 'sandbox',
			apiKey: 'sk_test_123',
			fetch: fetchMock as unknown as typeof fetch
		});

		await expect(client.getPaymentRequest(135)).rejects.toBeInstanceOf(
			Pagos360ResponseValidationError
		);
	});
});
