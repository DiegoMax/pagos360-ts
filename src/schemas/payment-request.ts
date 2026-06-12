import { z } from 'zod';

export const createPaymentRequestInputSchema = z.object({
	payerName: z.string().trim().min(1, 'payerName is required.'),
	description: z.string().trim().min(1, 'description is required.'),
	firstTotal: z
		.number({ message: 'firstTotal must be a number.' })
		.finite()
		.positive('firstTotal must be greater than zero.'),
	firstDueDate: z.union([z.date(), z.string().trim().min(1)]),
	externalReference: z.string().trim().min(1).optional(),
	backUrlSuccess: z.string().url().optional(),
	backUrlPending: z.string().url().optional(),
	backUrlRejected: z.string().url().optional(),
	payerEmail: z.string().email().optional(),
	metadata: z.record(z.unknown()).optional(),
	excludedChannels: z.array(z.string().trim().min(1)).optional()
});

export const paymentRequestWireSchema = z
	.object({
		id: z.number(),
		type: z.string().optional(),
		state: z.string().optional(),
		created_at: z.string().optional(),
		payer_name: z.string().optional(),
		description: z.string().optional(),
		first_due_date: z.string().optional(),
		first_total: z.number().optional(),
		external_reference: z.string().nullable().optional(),
		checkout_url: z.string().url().optional(),
		request_result_id: z.union([z.number(), z.string(), z.null()]).optional(),
		paid_at: z.string().nullable().optional()
	})
	.passthrough();
