import type { Pagos360Environment } from '../endpoints/constants.js';

export type { Pagos360Environment };

export type FetchLike = typeof fetch;

export interface Pagos360ClientConfig {
	environment: Pagos360Environment;
	apiKey: string;
	apiBaseUrl?: string;
	fetch?: FetchLike;
	timeoutMs?: number;
}

/**
 * Channels que se pueden excluir del checkout de una Solicitud de Pago.
 * Valores documentados por Pagos360; la API también acepta strings de
 * canales nuevos que aún no estén listados acá (por ejemplo `qr`).
 */
export const PAGOS360_CHANNELS = {
	creditCard: 'credit_card',
	debitCard: 'debit_card',
	nonBanking: 'non_banking',
	banelcoPmc: 'banelco_pmc',
	linkPagos: 'link_pagos',
	debin: 'DEBIN',
	wireTransfer: 'wire_transfer',
	qr: 'qr'
} as const;

export type Pagos360Channel =
	| (typeof PAGOS360_CHANNELS)[keyof typeof PAGOS360_CHANNELS]
	| (string & {});

export interface CreatePaymentRequestInput {
	payerName: string;
	description: string;
	firstTotal: number;
	firstDueDate: Date | string;
	externalReference?: string;
	backUrlSuccess?: string;
	backUrlPending?: string;
	backUrlRejected?: string;
	payerEmail?: string;
	metadata?: Record<string, unknown>;
	excludedChannels?: Pagos360Channel[];
}

export type PaymentRequestState =
	| 'pending'
	| 'paid'
	| 'rejected'
	| 'expired'
	| 'reverted'
	| 'refunded'
	| (string & {});

export interface PaymentRequestWire {
	id: number;
	type?: string;
	state?: string;
	created_at?: string;
	payer_name?: string;
	description?: string;
	first_due_date?: string;
	first_total?: number;
	external_reference?: string | null;
	checkout_url?: string;
	request_result_id?: number | string | null;
	paid_at?: string | null;
	[key: string]: unknown;
}

export interface PaymentRequest {
	id: number;
	state: PaymentRequestState;
	checkoutUrl: string;
	payerName: string | null;
	description: string | null;
	firstDueDate: string | null;
	firstTotal: number | null;
	externalReference: string | null;
	requestResultId: string | null;
	createdAt: string | null;
	paidAt: string | null;
	raw: PaymentRequestWire;
}

export interface CreatePaymentRequestResponse extends PaymentRequest {}

export interface Pagos360Client {
	createPaymentRequest(input: CreatePaymentRequestInput): Promise<PaymentRequest>;
	getPaymentRequest(id: string | number): Promise<PaymentRequest>;
}
