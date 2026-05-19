# @diegomax/pagos360

Cliente TypeScript para la API de [Pagos360](https://developers.pagos360.com/). Pensado para Node.js 22+.

## Instalación

```sh
npm install @diegomax/pagos360
```

## Uso

```ts
import { createPagos360Client } from '@diegomax/pagos360';

const client = createPagos360Client({
	environment: 'sandbox', // 'sandbox' | 'production'
	apiKey: process.env.PAGOS360_API_KEY!,
	timeoutMs: 25_000
});

const payment = await client.createPaymentRequest({
	payerName: 'Diego Massanti',
	description: 'Pago facturas 123, 124',
	firstTotal: 1234.56,
	firstDueDate: new Date(Date.now() + 30 * 60_000),
	externalReference: 'OP-REF-1',
	backUrlSuccess: 'https://miapp/api/pago/callback/pagos360?flow=ok&ref=OP-REF-1',
	backUrlPending: 'https://miapp/api/pago/callback/pagos360?flow=pending&ref=OP-REF-1',
	backUrlRejected: 'https://miapp/api/pago/callback/pagos360?flow=rejected&ref=OP-REF-1'
});

// payment.checkoutUrl → URL para redirigir al usuario.

const status = await client.getPaymentRequest(payment.id);
// status.state: 'pending' | 'paid' | 'rejected' | 'expired' | 'reverted' | 'refunded' | ...
```

## API

### `createPagos360Client(config)`

Opciones:

| Campo         | Tipo                            | Default                                                            |
| ------------- | ------------------------------- | ------------------------------------------------------------------ |
| `environment` | `'sandbox' \| 'production'`     | requerido                                                          |
| `apiKey`      | `string`                        | requerido (`Authorization: Bearer <apiKey>`)                       |
| `apiBaseUrl`  | `string`                        | `https://api.sandbox.pagos360.com` / `https://api.pagos360.com`    |
| `fetch`       | `typeof fetch`                  | `globalThis.fetch`                                                 |
| `timeoutMs`   | `number`                        | `25000`                                                            |

### `client.createPaymentRequest(input)`

`POST /payment-request`. Envía `{ payment_request: { payer_name, description, first_total, first_due_date, external_reference?, back_url_success?, back_url_pending?, back_url_rejected?, payer_email?, metadata? } }`. La fecha se serializa a `DD-MM-YYYY` (formato esperado por Pagos360).

### `client.getPaymentRequest(id)`

`GET /payment-request/{id}`. Devuelve el estado actual y los URLs/datos asociados.

## Errores

Todas las fallas heredan de `Pagos360Error`:

- `Pagos360ValidationError` — input rechazado por zod o pre-condiciones del cliente.
- `Pagos360HttpError` — la API respondió con un status no-2xx.
- `Pagos360ResponseValidationError` — la respuesta no coincide con el schema documentado.
- `Pagos360RequestError` — fallo de red / timeout / abort.

## Desarrollo

```sh
npm install
npm run typecheck
npm test
npm run build
```
