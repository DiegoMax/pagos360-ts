export type Pagos360Environment = 'sandbox' | 'production';

const DEFAULT_BASE_URLS: Record<Pagos360Environment, string> = {
	sandbox: 'https://api.sandbox.pagos360.com',
	production: 'https://api.pagos360.com'
};

export function resolveBaseUrl(environment: Pagos360Environment, override?: string): string {
	const candidate = override?.trim() || DEFAULT_BASE_URLS[environment];

	return candidate.replace(/\/+$/, '');
}

export const ENDPOINTS = {
	createPaymentRequest: '/payment-request',
	getPaymentRequest: (id: string | number) => `/payment-request/${encodeURIComponent(String(id))}`
} as const;
