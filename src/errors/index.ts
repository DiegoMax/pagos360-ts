import type { ZodIssue } from 'zod';

export interface Pagos360ErrorContext {
	endpoint?: string;
	statusCode?: number;
	responseBody?: unknown;
	responseHeaders?: Record<string, string>;
	issues?: ZodIssue[];
	cause?: unknown;
}

export class Pagos360Error extends Error {
	readonly endpoint?: string;
	readonly statusCode?: number;
	readonly responseBody?: unknown;
	readonly responseHeaders?: Record<string, string>;
	readonly issues?: ZodIssue[];

	constructor(message: string, context: Pagos360ErrorContext = {}) {
		super(message, context.cause !== undefined ? { cause: context.cause } : undefined);
		this.name = new.target.name;
		this.endpoint = context.endpoint;
		this.statusCode = context.statusCode;
		this.responseBody = context.responseBody;
		this.responseHeaders = context.responseHeaders;
		this.issues = context.issues;
	}
}

export class Pagos360ValidationError extends Pagos360Error {}
export class Pagos360HttpError extends Pagos360Error {}
export class Pagos360ResponseValidationError extends Pagos360Error {}
export class Pagos360RequestError extends Pagos360Error {}
