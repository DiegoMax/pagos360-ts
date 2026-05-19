import type { z } from 'zod';

import {
	Pagos360HttpError,
	Pagos360RequestError,
	Pagos360ResponseValidationError
} from '../errors/index.js';
import { headersToObject } from '../schemas/common.js';
import type { FetchLike } from '../types/public.js';

export interface Pagos360HttpClientConfig {
	baseUrl: string;
	apiKey: string;
	fetch: FetchLike;
	timeoutMs: number;
}

type HttpMethod = 'GET' | 'POST';

export interface SendOptions<TSchema extends z.ZodTypeAny> {
	endpoint: string;
	method?: HttpMethod;
	body?: Record<string, unknown>;
	responseSchema: TSchema;
}

function tryParseJson(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

function buildHttpErrorMessage(status: number, endpoint: string): string {
	return `Pagos360 request to ${endpoint} failed with HTTP ${status}.`;
}

export class Pagos360HttpClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;
	private readonly fetchImpl: FetchLike;
	private readonly timeoutMs: number;

	constructor(config: Pagos360HttpClientConfig) {
		this.baseUrl = config.baseUrl;
		this.apiKey = config.apiKey;
		this.fetchImpl = config.fetch;
		this.timeoutMs = config.timeoutMs;
	}

	async send<TSchema extends z.ZodTypeAny>({
		endpoint,
		method = 'POST',
		body,
		responseSchema
	}: SendOptions<TSchema>): Promise<z.infer<TSchema>> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
		const url = `${this.baseUrl}${endpoint}`;

		try {
			const response = await this.fetchImpl(url, {
				method,
				headers: {
					accept: 'application/json',
					...(body !== undefined ? { 'content-type': 'application/json' } : {}),
					authorization: `Bearer ${this.apiKey}`
				},
				body: body !== undefined ? JSON.stringify(body) : undefined,
				signal: controller.signal
			});

			const text = await response.text();
			const parsedBody = text ? tryParseJson(text) : null;

			if (!response.ok) {
				throw new Pagos360HttpError(buildHttpErrorMessage(response.status, endpoint), {
					endpoint: url,
					statusCode: response.status,
					responseBody: parsedBody ?? text,
					responseHeaders: headersToObject(response.headers)
				});
			}

			const parsedResponse = responseSchema.safeParse(parsedBody);

			if (!parsedResponse.success) {
				throw new Pagos360ResponseValidationError(
					`Pagos360 response for ${endpoint} did not match the documented schema.`,
					{
						endpoint: url,
						statusCode: response.status,
						responseBody: parsedBody,
						responseHeaders: headersToObject(response.headers),
						issues: parsedResponse.error.issues
					}
				);
			}

			return parsedResponse.data;
		} catch (error) {
			if (
				error instanceof Pagos360HttpError ||
				error instanceof Pagos360ResponseValidationError
			) {
				throw error;
			}

			if (controller.signal.aborted) {
				throw new Pagos360RequestError(`Request to ${endpoint} timed out.`, {
					endpoint: url,
					cause: error
				});
			}

			throw new Pagos360RequestError(`Request to ${endpoint} failed.`, {
				endpoint: url,
				cause: error
			});
		} finally {
			clearTimeout(timeout);
		}
	}
}
