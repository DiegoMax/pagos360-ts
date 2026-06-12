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

`POST /payment-request`. Envía `{ payment_request: { payer_name, description, first_total, first_due_date, external_reference?, back_url_success?, back_url_pending?, back_url_rejected?, payer_email?, metadata?, excluded_channels? } }`. La fecha se serializa a `DD-MM-YYYY` (formato esperado por Pagos360).

#### Restringir medios de pago (`excludedChannels`)

El checkout de Pagos360 muestra todos los canales habilitados en la cuenta. Para restringirlo, `excludedChannels` excluye los canales indicados (se envía como `excluded_channels`). Las constantes `PAGOS360_CHANNELS` cubren los canales conocidos:

```ts
import { PAGOS360_CHANNELS } from '@diegomax/pagos360';

// Ejemplo: dejar solo el pago con QR.
const payment = await client.createPaymentRequest({
	// ...campos habituales...
	payerName: 'Diego Massanti',
	description: 'Pago factura 123',
	firstTotal: 1234.56,
	firstDueDate: new Date(Date.now() + 30 * 60_000),
	excludedChannels: [
		PAGOS360_CHANNELS.creditCard,
		PAGOS360_CHANNELS.debitCard,
		PAGOS360_CHANNELS.nonBanking,
		PAGOS360_CHANNELS.banelcoPmc,
		PAGOS360_CHANNELS.linkPagos,
		PAGOS360_CHANNELS.debin,
		PAGOS360_CHANNELS.wireTransfer
	]
});
```

| Constante                       | Valor enviado     | Canal                          |
| ------------------------------- | ----------------- | ------------------------------ |
| `PAGOS360_CHANNELS.creditCard`  | `credit_card`     | Tarjeta de crédito             |
| `PAGOS360_CHANNELS.debitCard`   | `debit_card`      | Tarjeta de débito              |
| `PAGOS360_CHANNELS.nonBanking`  | `non_banking`     | Efectivo (Rapipago/Pago Fácil) |
| `PAGOS360_CHANNELS.banelcoPmc`  | `banelco_pmc`     | Pagos Mis Cuentas (Banelco)    |
| `PAGOS360_CHANNELS.linkPagos`   | `link_pagos`      | Link Pagos                     |
| `PAGOS360_CHANNELS.debin`       | `DEBIN`           | DEBIN                          |
| `PAGOS360_CHANNELS.wireTransfer`| `wire_transfer`   | Transferencia                  |
| `PAGOS360_CHANNELS.qr`          | `qr`              | Código QR                      |

> Nota: la [documentación oficial](https://ayuda.pagos360.com/desarrolladores/API-crear-solicitud-de-pago) lista como excluibles `credit_card`, `debit_card`, `banelco_pmc`, `link_pagos`, `DEBIN`, `wire_transfer` y `non_banking`. `qr` no figura en esa lista, pero la API acepta strings de canales nuevos (el tipo `Pagos360Channel` admite cualquier `string`).

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
