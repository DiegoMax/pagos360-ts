import type {
	CreatePaymentRequestInput,
	PaymentRequest,
	PaymentRequestWire
} from '../types/public.js';

function toDDMMYYYY(value: Date): string {
	const day = String(value.getUTCDate()).padStart(2, '0');
	const month = String(value.getUTCMonth() + 1).padStart(2, '0');
	const year = value.getUTCFullYear();

	return `${day}-${month}-${year}`;
}

export function formatDueDate(value: Date | string): string {
	if (value instanceof Date) {
		return toDDMMYYYY(value);
	}

	const trimmed = value.trim();

	if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
		return trimmed;
	}

	const parsed = new Date(trimmed);

	if (Number.isNaN(parsed.getTime())) {
		return trimmed;
	}

	return toDDMMYYYY(parsed);
}

export function mapCreatePaymentRequestInput(input: CreatePaymentRequestInput): Record<string, unknown> {
	const body: Record<string, unknown> = {
		payer_name: input.payerName,
		description: input.description,
		first_total: input.firstTotal,
		first_due_date: formatDueDate(input.firstDueDate)
	};

	if (input.externalReference !== undefined) {
		body.external_reference = input.externalReference;
	}

	if (input.backUrlSuccess !== undefined) {
		body.back_url_success = input.backUrlSuccess;
	}

	if (input.backUrlPending !== undefined) {
		body.back_url_pending = input.backUrlPending;
	}

	if (input.backUrlRejected !== undefined) {
		body.back_url_rejected = input.backUrlRejected;
	}

	if (input.payerEmail !== undefined) {
		body.payer_email = input.payerEmail;
	}

	if (input.metadata !== undefined) {
		body.metadata = input.metadata;
	}

	return { payment_request: body };
}

function normalizeRequestResultId(value: unknown): string | null {
	if (value === null || value === undefined || value === '') {
		return null;
	}

	return String(value);
}

export function mapPaymentRequest(wire: PaymentRequestWire): PaymentRequest {
	return {
		id: wire.id,
		state: (wire.state ?? 'unknown') as PaymentRequest['state'],
		checkoutUrl: wire.checkout_url ?? '',
		payerName: wire.payer_name ?? null,
		description: wire.description ?? null,
		firstDueDate: wire.first_due_date ?? null,
		firstTotal: typeof wire.first_total === 'number' ? wire.first_total : null,
		externalReference: wire.external_reference ?? null,
		requestResultId: normalizeRequestResultId(wire.request_result_id),
		createdAt: wire.created_at ?? null,
		paidAt: wire.paid_at ?? null,
		raw: wire
	};
}
