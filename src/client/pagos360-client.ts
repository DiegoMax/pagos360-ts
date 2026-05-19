import type { z } from 'zod';

import { Pagos360ValidationError } from '../errors/index.js';
import { ENDPOINTS, resolveBaseUrl } from '../endpoints/constants.js';
import { mapCreatePaymentRequestInput, mapPaymentRequest } from '../mappers/index.js';
import {
	createPaymentRequestInputSchema,
	paymentRequestWireSchema
} from '../schemas/payment-request.js';
import type {
	CreatePaymentRequestInput,
	PaymentRequest,
	Pagos360Client,
	Pagos360ClientConfig
} from '../types/public.js';
import { Pagos360HttpClient } from './http-client.js';

const DEFAULT_TIMEOUT_MS = 25_000;

function parseOrThrow<TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	input: unknown,
	message: string
): z.infer<TSchema> {
	const result = schema.safeParse(input);

	if (!result.success) {
		throw new Pagos360ValidationError(message, { issues: result.error.issues });
	}

	return result.data;
}

export function createPagos360Client(config: Pagos360ClientConfig): Pagos360Client {
	if (!config.apiKey || !config.apiKey.trim()) {
		throw new Pagos360ValidationError('Pagos360 apiKey is required.');
	}

	const baseUrl = resolveBaseUrl(config.environment, config.apiBaseUrl);
	const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const fetchImpl = config.fetch ?? globalThis.fetch;

	if (!fetchImpl) {
		throw new Pagos360ValidationError(
			'Pagos360 client requires a global fetch implementation or an explicit fetch option.'
		);
	}

	const httpClient = new Pagos360HttpClient({
		baseUrl,
		apiKey: config.apiKey,
		fetch: fetchImpl,
		timeoutMs
	});

	async function createPaymentRequest(input: CreatePaymentRequestInput): Promise<PaymentRequest> {
		const parsedInput = parseOrThrow(
			createPaymentRequestInputSchema,
			input,
			'Invalid createPaymentRequest input.'
		);

		const response = await httpClient.send({
			endpoint: ENDPOINTS.createPaymentRequest,
			method: 'POST',
			body: mapCreatePaymentRequestInput(parsedInput),
			responseSchema: paymentRequestWireSchema
		});

		return mapPaymentRequest(response);
	}

	async function getPaymentRequest(id: string | number): Promise<PaymentRequest> {
		const normalized = String(id).trim();

		if (!normalized) {
			throw new Pagos360ValidationError('getPaymentRequest requires a non-empty id.');
		}

		const response = await httpClient.send({
			endpoint: ENDPOINTS.getPaymentRequest(normalized),
			method: 'GET',
			responseSchema: paymentRequestWireSchema
		});

		return mapPaymentRequest(response);
	}

	return {
		createPaymentRequest,
		getPaymentRequest
	};
}
